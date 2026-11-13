import { orderedExperience } from '../cms/experience.js';
import { api, checkFile, configured, webUrl } from '../cms/api.js';

const byId = id => document.getElementById(id);
const login = byId('login');
const dashboard = byId('dashboard');
const editor = byId('editor');
const status = byId('status');
let row, screen, dirty = false, busy = false;
const objectUrls = new Set();

function node(tag, text) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  return element;
}
function button(label, action, className) {
  const control = node('button', label);
  control.type = 'button';
  if (className) control.className = className;
  control.addEventListener('click', action);
  return control;
}
function actions(...controls) {
  const group = node('div');
  group.className = 'actions';
  group.append(...controls);
  return group;
}
function say(message) { status.textContent = message; }
async function run(operation) {
  if (busy) return;
  busy = true;
  const visible = row ? dashboard : login;
  visible.inert = true;
  say('Working…');
  try { await operation(); }
  catch (error) { say(error.message); }
  finally { visible.inert = false; busy = false; }
}
function resetEditor(next) {
  for (const url of objectUrls) URL.revokeObjectURL(url);
  objectUrls.clear();
  dirty = false;
  screen = next;
  editor.replaceChildren();
  for (const id of ['projects','content']) {
    if (next === id) byId(id).setAttribute('aria-current','page');
    else byId(id).removeAttribute('aria-current');
  }
}
function mayLeave() { return !dirty || confirm('Discard your unsaved changes?'); }
function field(parent, model, key, label, type = 'text', required = false) {
  const wrapper = node('label', label);
  const input = node(type === 'textarea' ? 'textarea' : 'input');
  if (type !== 'textarea') input.type = type;
  input.value = model[key] ?? '';
  input.required = required;
  input.addEventListener('input', () => { model[key] = input.value; dirty = true; });
  wrapper.append(input);
  parent.append(wrapper);
}
function group(parent, title) {
  const section = node('fieldset');
  section.append(node('legend', title));
  parent.append(section);
  return section;
}
function mediaField(parent, model, key, label, kind, files) {
  const section = group(parent, label);
  const preview = node(kind === 'pdf' ? 'a' : 'img');
  if (kind === 'pdf') {
    preview.textContent = 'Open PDF preview';
    preview.target = '_blank';
    preview.rel = 'noopener';
  } else preview.alt = label + ' preview';
  preview.className = 'preview';
  const message = node('p', 'No file selected.');
  const control = node('input');
  control.type = 'file';
  control.accept = kind === 'pdf' ? 'application/pdf' : 'image/png,image/jpeg,image/webp,image/gif';
  control.setAttribute('aria-label', label);
  const remove = button('Remove file', () => {
    selection++;
    model[key] = '';
    files.delete(key);
    control.value = '';
    message.textContent = 'File will be removed when you save.';
    show('');
    dirty = true;
  });
  let selection = 0;
  function show(url) {
    preview.hidden = !url;
    if (url) preview.setAttribute(kind === 'pdf' ? 'href' : 'src', url);
    else preview.removeAttribute(kind === 'pdf' ? 'href' : 'src');
  }
  show('');
  if (model[key]) {
    message.textContent = 'Current file';
    api.media(model[key], '../portfolio/').then(url => {
      if (!selection && model[key]) show(url);
    }).catch(() => { if (!selection && model[key]) message.textContent = 'Current file preview unavailable.'; });
  }
  control.addEventListener('change', async () => {
    const file = control.files[0];
    if (!file) return;
    const current = ++selection;
    try {
      await checkFile(file, kind);
      if (current !== selection || control.files[0] !== file) return;
      const url = URL.createObjectURL(file);
      objectUrls.add(url);
      files.set(key, {file,kind});
      show(url);
      message.textContent = file.name;
      dirty = true;
    } catch (error) {
      if (current !== selection) return;
      control.value = '';
      say(error.message);
    }
  });
  section.append(preview,message,control,remove);
}
async function saveFiles(model, files) {
  const saved = structuredClone(model);
  for (const [key, {file,kind}] of files) saved[key] = await api.upload(file,kind);
  return saved;
}
function saveButton(form, label, operation) {
  return button(label, () => {
    if (form.reportValidity()) void run(operation);
  }, 'primary');
}

const emptyProject = () => ({id:crypto.randomUUID(), title:'', description:'', stack:'',
  github:'', demo:'', label:'', alt:'', image:'', published:false});

function showProjects() {
  resetEditor('projects');
  editor.append(node('h1','Projects'), button('Add project', () => editProject(emptyProject()),'primary'));
  if (!row.projects.length) editor.append(node('p','No projects yet.'));
  row.projects.forEach((project,index) => {
    const article = node('article');
    article.className = 'item';
    const move = direction => run(async () => {
      const projects = [...row.projects];
      const to = index + direction;
      [projects[index],projects[to]] = [projects[to],projects[index]];
      row = await api.save(row,{projects});
      showProjects();
      say('Project order saved.');
    });
    const up = button('Move up', () => move(-1));
    const down = button('Move down', () => move(1));
    up.disabled = index === 0;
    down.disabled = index === row.projects.length-1;
    article.append(node('h3',project.title), node('p',project.published ? 'Published' : 'Draft'),
      actions(button('Edit', () => editProject(project)),up,down,button('Delete', () => {
        if (!confirm('Delete “'+project.title+'”?')) return;
        void run(async () => {
          row = await api.save(row,{projects:row.projects.filter(item => item.id !== project.id)});
          showProjects();
          say('Project deleted.');
        });
      },'danger')));
    editor.append(article);
  });
}
function editProject(original) {
  resetEditor('projects');
  const project = structuredClone(original);
  const files = new Map();
  const form = node('form');
  form.addEventListener('submit', event => event.preventDefault());
  field(form,project,'title','Project title','text',true);
  field(form,project,'description','Description','textarea');
  field(form,project,'stack','Technologies (comma-separated)');
  field(form,project,'github','GitHub URL','url');
  field(form,project,'demo','Live demo URL','url');
  field(form,project,'label','Category');
  field(form,project,'alt','Screenshot description for screen readers');
  mediaField(form,project,'image','Project screenshot','image',files);
  const save = published => async () => {
    if (!project.title.trim()) throw new Error('Enter a project title.');
    for (const url of [project.github,project.demo]) if (url && !webUrl(url)) throw new Error('Use an HTTP or HTTPS link.');
    const saved = await saveFiles({...project,published},files);
    const projects = [...row.projects];
    const index = projects.findIndex(item => item.id === saved.id);
    if (index < 0) projects.push(saved);
    else projects[index] = saved;
    row = await api.save(row,{projects});
    showProjects();
    say(published ? 'Project published.' : 'Draft saved.');
  };
  form.append(actions(saveButton(form,original.published ? 'Update published project' : 'Publish',save(true)),
    saveButton(form,original.published ? 'Unpublish and save as draft' : 'Save draft',save(false)),
    button('Cancel', () => { if (mayLeave()) showProjects(); })));
  editor.append(node('h1',original.title ? 'Edit project' : 'New project'),form);
}

function list(parent, site, key, label, fields) {
  const section = group(parent,label);
  const entries = node('div');
  function draw(newEntry) {
    entries.replaceChildren();
    const records = key === 'experience' ? orderedExperience(site[key]) :
      site[key].map((entry,index) => ({entry,index}));
    for (const {entry,index} of records) {
      const item = group(entries,label+' '+(index+1));
      for (const [property,name,type] of fields) {
        field(item,entry,property,name,type,property === 'startDate' && Object.hasOwn(entry,'startDate'));
      }
      if (entry === newEntry) item.querySelector('input, textarea').focus();
      item.append(button('Remove entry', () => {
        site[key].splice(index,1);
        dirty = true;
        draw();
      },'danger'));
    }
  }
  section.append(entries,button('Add entry', () => {
    const entry = Object.fromEntries(fields.map(([property]) => [property,'']));
    site[key].push(entry);
    dirty = true;
    draw(entry);
  }));
  draw();
}
function showContent() {
  resetEditor('content');
  const site = structuredClone(row.site);
  const files = new Map();
  const form = node('form');
  form.addEventListener('submit', event => event.preventDefault());
  const sections = [
    ['Profile',[['firstName','First name'],['lastName','Last name'],['initials','Navigation initials'],['headline','Headline'],['intro','Introduction']]],
    ['About',[['aboutHeading','Heading'],['aboutAccent','Italic heading line'],['bio','Biography','textarea'],['availability','Availability','textarea'],['emphasis','Text to bold within availability']]],
    ['Section headings',[['skillsHeading','Skills'],['experienceHeading','Experience'],['projectsHeading','Projects']]],
    ['Contact and footer',[['contactHeading','Contact heading'],['contactText','Contact introduction','textarea'],['email','Public email','email'],['phone','Public phone','tel'],['location','Location'],['year','Copyright year'],['footerNote','Footer note'],['interests','Interests ticker (one item per line)','textarea']]]
  ];
  for (const [title,fields] of sections) {
    const section = group(form,title);
    for (const [key,label,type] of fields) field(section,site,key,label,type);
  }
  mediaField(form,site,'photo','Profile picture','image',files);
  mediaField(form,site,'resume','PDF résumé','pdf',files);
  list(form,site,'stats','About statistics',[['value','Value'],['label','Label']]);
  list(form,site,'skills','Skill groups',[['icon','Icon or symbol'],['title','Group name'],['items','Technologies or skills']]);
  const timelineFields = [['title','Title'],['organization','Organization'],['dates','Dates'],['details','Description (one bullet per line)','textarea']];
  list(form,site,'experience','Work experience',[...timelineFields,
    ['startDate','Start date for sorting','date']]);
  list(form,site,'education','Education',timelineFields);
  list(form,site,'socials','Social links',[['label','Link label'],['url','URL','url']]);
  form.append(saveButton(form,'Save and publish site content',async () => {
    if (site.socials.some(link => !link.label.trim() || !webUrl(link.url))) throw new Error('Each social link needs a label and an HTTP or HTTPS URL.');
    row = await api.save(row,{site:await saveFiles(site,files)});
    showContent();
    say('Site content published.');
  }));
  editor.append(node('h1','Site content'),form);
}

if (!configured) {
  say('The dashboard is awaiting Supabase setup. See SETUP.md in the website package.');
  login.querySelector('button').disabled = true;
}
login.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(login);
  void run(async () => {
    try { row = await api.signIn(data.get('email'),data.get('password')); }
    finally { login.elements.password.value = ''; }
    login.hidden = true;
    dashboard.hidden = false;
    showProjects();
    say('Signed in.');
  });
});
byId('projects').addEventListener('click', () => { if (mayLeave()) showProjects(); });
byId('content').addEventListener('click', () => { if (screen !== 'content' && mayLeave()) showContent(); });
byId('logout').addEventListener('click', () => {
  if (!mayLeave()) return;
  void run(async () => {
    try { await api.signOut(); say('Signed out.'); }
    finally {
      row = undefined;
      resetEditor();
      dashboard.hidden = true;
      login.hidden = false;
    }
  });
});
window.addEventListener('beforeunload', event => {
  if (dirty) { event.preventDefault(); event.returnValue = true; }
});

