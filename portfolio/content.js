import { orderedExperience } from '../cms/experience.js';
import { api, configured, webUrl } from '../cms/api.js';

const find = selector => document.querySelector(selector);
const text = (selector, value) => { find(selector).textContent = value; };
const element = (tag, value, className) => {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
};
const timeline = find('.timeline');
const timelineTemplate = timeline.firstElementChild.cloneNode(true);
const grid = find('.projects-grid');
const cardTemplate = grid.firstElementChild.cloneNode(true);
const skills = find('.skills-grid');
const skillTemplate = skills.firstElementChild.cloneNode(true);
const stats = find('.about-stats');
const statTemplate = stats.firstElementChild.cloneNode(true);

function rows(container, template, values, fill) {
  container.replaceChildren(...values.map(value => {
    const node = template.cloneNode(true);
    fill(node, value);
    return node;
  }));
}
const set = (node, selector, value) => { node.querySelector(selector).textContent = value; };
const lines = value => value.split('\n').map(line => line.trim()).filter(Boolean);
function timelineRow(node, entry) {
  set(node, '.timeline-date', entry.dates);
  set(node, 'h3', entry.title);
  set(node, '.timeline-org', entry.organization);
  node.querySelector('ul').replaceChildren(...lines(entry.details).map(line => element('li', line)));
}
function link(label, url, className) {
  const node = element('a', label, className);
  node.href = url;
  if (webUrl(url)) { node.target = '_blank'; node.rel = 'noopener'; }
  return node;
}

async function render({site, projects}) {
  const media = new Map();
  await Promise.all([site.photo, site.resume, ...projects.map(project => project.image)].map(async ref => {
    if (!ref) return;
    try { media.set(ref, await api.media(ref)); }
    catch (error) { console.warn('Portfolio media could not be loaded', error); }
  }));
  const name = [site.firstName, site.lastName].filter(Boolean).join(' ');
  document.title = name + ' — Portfolio';
  text('.nav-logo', site.initials);
  text('.hero-name span:first-child', site.firstName);
  text('.hero-name .accent-word', site.lastName);
  text('.hero-eyebrow', site.headline);
  text('.hero-tagline', site.intro);
  const photo = find('.hero-avatar');
  if (media.get(site.photo)) { photo.src = media.get(site.photo); photo.alt = name; }
  else if (!site.photo) find('.hero-avatar-wrap').hidden = true;

  find('#about .section-heading').replaceChildren(document.createTextNode(site.aboutHeading),
    document.createElement('br'), element('em', site.aboutAccent));
  const [bio, availability] = document.querySelectorAll('#about .body-text');
  bio.textContent = site.bio;
  const emphasisIndex = site.emphasis ? site.availability.indexOf(site.emphasis) : -1;
  if (emphasisIndex === -1) availability.textContent = site.availability;
  else availability.replaceChildren(site.availability.slice(0, emphasisIndex), element('strong', site.emphasis),
    site.availability.slice(emphasisIndex + site.emphasis.length));
  rows(stats, statTemplate, site.stats, (node, entry) => {
    set(node, '.stat-num', entry.value);
    set(node, '.stat-label', entry.label);
  });
  text('#skills .section-heading', site.skillsHeading);
  rows(skills, skillTemplate, site.skills, (node, entry) => {
    set(node, '.skill-icon', entry.icon);
    set(node, 'h3', entry.title);
    set(node, 'p', entry.items);
  });
  text('#experience .section-heading', site.experienceHeading);
  rows(timeline, timelineTemplate, orderedExperience(site.experience).map(({entry}) => entry), timelineRow);
  if (site.education.length) {
    const education = find('#experience .container');
    education.append(element('h2','Education','section-heading reveal'));
    const list = element('div','','timeline');
    rows(list, timelineTemplate, site.education, timelineRow);
    education.append(list);
  }
  text('#projects .section-heading', site.projectsHeading);
  rows(grid, cardTemplate, projects, (node, project) => {
    const demo = webUrl(project.demo);
    const github = webUrl(project.github);
    if (demo || github) node.href = demo || github;
    else { node.removeAttribute('href'); node.querySelector('.project-overlay').remove(); }
    node.dataset.label = project.label;
    const image = node.querySelector('img');
    if (media.get(project.image)) {
      image.src = media.get(project.image);
      image.alt = project.alt || project.title;
    } else {
      node.querySelector('.project-img-wrap').remove();
    }
    set(node, 'h3', project.title);
    set(node, '.project-info p', project.description);
    node.querySelector('.project-tags').replaceChildren(...project.stack.split(',').map(tag => tag.trim())
      .filter(Boolean).map(tag => element('span', tag)));
    if (demo && github && demo !== github) {
      // An anchor cannot contain a second link. Keep the existing card and add its source link beside it.
      queueMicrotask(() => {
        const wrapper = element('div', '', 'project-with-source');
        node.replaceWith(wrapper);
        wrapper.append(node, link('GitHub ↗', github, 'contact-pill'));
      });
    }
  });
  const ticker = find('.ticker');
  const interests = lines(site.interests);
  ticker.replaceChildren(...[...interests,...interests].flatMap(interest => [
    element('span', interest), ' ', element('span', '◆', 'ticker-dot'), ' '
  ]));
  ticker.parentElement.hidden = !interests.length;
  text('#contact .section-heading', site.contactHeading);
  text('#contact .body-text', site.contactText);
  const links = find('.contact-links');
  links.replaceChildren();
  for (const [value, url, icon] of [[site.email, 'mailto:'+site.email,'✉'],
    [site.phone, 'tel:'+site.phone.replace(/[^\d+]/g,''),'✆']]) {
    if (!value) continue;
    const pill = link('', url, 'contact-pill');
    pill.append(element('span', icon, 'contact-icon'), ' '+value);
    links.append(pill);
  }
  for (const social of site.socials) {
    const url = webUrl(social.url);
    if (url) links.append(link(social.label, url, 'contact-pill'));
  }
  if (media.get(site.resume)) links.append(link('Résumé PDF', media.get(site.resume), 'contact-pill'));
  text('.footer p:first-child', '© '+site.year+' '+name+(site.location ? ' · '+site.location : ''));
  text('.footer-note', site.footerNote);
  document.dispatchEvent(new Event('portfolio:render'));
}

if (configured) {
  try {
    const content = await api.publicContent();
    if (content) await render(content);
  } catch (error) { console.warn('Using the bundled portfolio snapshot', error); }
}

