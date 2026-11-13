insert into public.portfolio (id, site, projects) values (true, $content${
  "initials": "HK",
  "firstName": "Hasan",
  "lastName": "Kerret",
  "headline": "Computer Science @ York University",
  "intro": "Developer · Strategist · Builder",
  "photo": "images/profile.jpg",
  "resume": "",
  "aboutHeading": "Turning ideas into",
  "aboutAccent": "real solutions.",
  "bio": "I'm a 4th-year Computer Science student at York University's Lassonde School of Engineering, blending technical depth with strategic thinking. From developing modular service-booking systems to providing technical project insights for private market platforms, I thrive at the intersection of code and business.",
  "availability": "Available for 4, 8, or 12-month co-op opportunities. Based in Scarborough, Toronto.",
  "emphasis": "4, 8, or 12-month",
  "stats": [
    {
      "value": "2",
      "label": "Consulting Projects"
    },
    {
      "value": "4+",
      "label": "Projects"
    },
    {
      "value": "12+",
      "label": "Technologies"
    }
  ],
  "skillsHeading": "Tools of the trade.",
  "experienceHeading": "Where I've contributed.",
  "projectsHeading": "Things I've built.",
  "contactHeading": "Let's work together.",
  "skills": [
    {
      "icon": "</>",
      "title": "Languages",
      "items": "C · Java · Python · JavaScript · SQL · HTML/CSS"
    },
    {
      "icon": "⚙",
      "title": "Technologies",
      "items": "Next.js · MySQL · Oracle DB · Git · Unix · Power Apps · Tableau"
    },
    {
      "icon": "▲",
      "title": "Practices",
      "items": "API Development · OOP · Data Analysis · Unit Testing · Agile · Web Development"
    },
    {
      "icon": "◆",
      "title": "Soft Skills",
      "items": "Project Management · Team Collaboration · Communication · Agile Leadership"
    }
  ],
  "experience": [
    {
      "dates": "March 2026 · Contract",
      "title": "Strategy Consultant",
      "organization": "Foodies in the Kitchen",
      "details": "Advised a digital coaching business on messaging & value proposition to improve client acquisition.\nDeveloped positioning statements targeting busy professionals aged 25–55.\nConducted SWOT analysis to identify gaps in brand clarity and audience targeting.\nRecommended improvements to website, LinkedIn, and outreach strategy to increase lead generation."
    },
    {
      "dates": "January 2026 · Contract",
      "title": "Strategy Consultant",
      "organization": "Roots Funding",
      "details": "Advised a global private markets platform on growth strategy across Canada, US, UK, EU, and UAE.\nEvaluated pathways to scale assets under management toward a $1B target.\nConducted SWOT analysis on market expansion, customer segments, and competitive positioning.\nDelivered strategic recommendations to support investor acquisition and platform growth."
    }
  ],
  "education": [],
  "socials": [],
  "interests": "Technology Trends\nFinance\nFitness\nSoccer\nGenerative Art",
  "contactText": "Open to co-op roles, freelance projects, and conversations about tech & strategy. Reach out — I reply fast.",
  "email": "Hasankerret@gmail.com",
  "phone": "437-766-2928",
  "location": "Scarborough, Toronto",
  "year": "2026",
  "footerNote": "Built with care."
}$content$::jsonb, $content$[
  {
    "id": "original-1",
    "published": true,
    "title": "Service Booking & Consulting Platform",
    "description": "A full-stack system designed to streamline client-consultant connections through automated booking lifecycles and simulated payment workflows. The architecture focuses on clean object-oriented design and the integration of GoF design patterns.",
    "stack": "JavaScript, HTML/CSS, API, Java, Docker",
    "github": "https://github.com/lalogongum/EECS-3311-project",
    "demo": "",
    "label": "Web · JavaScript",
    "image": "images/consultant.png",
    "alt": "Service Booking & Consulting Platform"
  },
  {
    "id": "original-2",
    "published": true,
    "title": "Flappy Bird Clone",
    "description": "A dynamic 2D side-scroller built with the p5.js library, featuring custom physics for gravity and collision detection. I implemented multiple difficulty modes that adjust game velocity and obstacle density, alongside a power-up system and state-based game flow.",
    "stack": "P5.js, Creative coding, Game physics",
    "github": "",
    "demo": "https://editor.p5js.org/lalogongum/full/OH6kwALGw",
    "label": "Web · Full Stack",
    "image": "images/flappybird.png",
    "alt": "Project 2"
  },
  {
    "id": "original-3",
    "published": true,
    "title": "Tick-Tock Trivia",
    "description": "Developed a geography quiz game using p5.js, featuring timed multiple-choice questions, score tracking, and sound effects for correct and incorrect answers. The game includes custom background images, a restart option, and a real-time timer for added challenge.",
    "stack": "P5.js, Game logic, UI desgin, Audio Integeration",
    "github": "",
    "demo": "https://editor.p5js.org/lalogongum/full/onQPxgfu5",
    "label": "App · Python",
    "image": "images/quizgame.png",
    "alt": "Project 3"
  },
  {
    "id": "original-4",
    "published": true,
    "title": "Endless Runner Game",
    "description": "Developed an endless runner game using Unity and C# as part of a project at York University, featuring coin collection, health pickups, and combat modes. Implemented endless level generation with varying obstacles and collectibles, designed intuitive controls, and created responsive gameplay to enhance user experience.",
    "stack": "Unity, Game design, C#",
    "github": "",
    "demo": "https://hasan-kerret.itch.io/endless-runner",
    "label": "App · Java",
    "image": "images/unity.png",
    "alt": "Project 4"
  }
]$content$::jsonb) on conflict (id) do nothing;
