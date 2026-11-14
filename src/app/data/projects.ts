export interface Project {
  slug: string;           // url id: /projects/:slug
  title: string;
  tagline: string;        // one-liner for showcase cards
  description: string[];  // paragraphs for the detail page
  highlights?: string[];  // key features, shown as a list on the detail page
  tech: string[];
  platform: 'web' | 'mobile'; // home page toggle + device frame (laptop / phone)
  cover?: string;         // main screenshot; omit until provided -> placeholder
  screenshots?: Screenshot[]; // gallery on the detail page
  links?: { live?: string; repo?: string };
  tool?: string;          // route of a tool that runs on this site -> "Try it" button
  concept?: boolean;      // mock or pitch, not real client work -> "Concept" label
  year?: number;
}

export interface Screenshot {
  src: string;
  caption: string;         // shown under the image and used as its alt text
}

/** Card label; no label = archive (screenshots only). */
export const projectLabel = (p: Project): string | undefined =>
  p.tool ? 'Interactive' : p.concept ? 'Concept' : p.links?.live ? 'Live site' : undefined;

const img = (slug: string, file = 'cover.png') => `assets/images/projects/${slug}/${file}`;

// Array order = display order.
export const projects: Project[] = [
  // SLMP hidden for now — uncomment to show it again.
  // {
  //   slug: 'slmp',
  //   title: 'Surefire Local Marketing Platform',
  //   tagline: 'All-in-one marketing software that makes online marketing easy for local businesses.',
  //   description: [
  //     'Surefire Local Marketing Platform (SLMP) is an all-in-one marketing software that helps businesses make online marketing easy.',
  //     'Clients can create and publish content to all their social media channels, send marketing texts and emails to increase repeat business, track SEO results across keywords, update business info across 70+ channels at once, automate lead generation and sales, and streamline review management, monitoring and replies.',
  //   ],
  //   highlights: [
  //     'Publish content to every social channel at once',
  //     'SMS and email marketing campaigns',
  //     'SEO keyword tracking',
  //     'Business listings synced across 70+ channels',
  //     'Review management, monitoring and replies',
  //   ],
  //   tech: ['Laravel', 'Angular'],
  //   platform: 'web',
  //   cover: img('slmp'),
  // },
  {
    slug: 'soundwave',
    title: 'Soundwave',
    tagline: 'Turn any sound recording into an audio visualizer video, right in your browser.',
    description: [
      'Soundwave turns a sound recording into an MP4 video of spectrum bars that bounce with the audio, ready to share.',
      'Everything runs in the browser: the audio is decoded with the Web Audio API, split into frequency bands with an FFT, each frame is drawn on a canvas, and the video is encoded with WebCodecs. Nothing is uploaded, so recordings stay private and there is no server to pay for.',
    ],
    highlights: [
      'Exports MP4 (H.264 video + AAC audio)',
      'Renders faster than real time',
      'Audio never leaves your device',
    ],
    tech: ['Angular', 'Tailwind CSS', 'WebCodecs'],
    platform: 'web',
    cover: img('soundwave'),
    screenshots: [
      { src: img('soundwave', '01.png'), caption: 'Mirrored pixel bars, the default look' },
      { src: img('soundwave', '02.png'), caption: 'Bottom bars with a gradient, peak caps and glow' },
      { src: img('soundwave', '03.png'), caption: 'Circle of 96 rainbow pixel bars with glow' },
    ],
    tool: '/tools/soundwave',
    year: 2026,
  },
  {
    slug: 'mopac',
    title: 'MSU Mobile Library Catalog',
    tagline: 'Check if a book is available at the Mindanao State University library, right from your phone.',
    description: [
      'An Android app for checking the availability of publications housed in the Mindanao State University library.',
      'The app is called MOPAC, or Mobile OPAC (Online Public Access Catalog).',
    ],
    tech: ['Android', 'PHP'],
    platform: 'mobile',
    cover: img('mopac'),
  },
  {
    slug: 'avc-reservation',
    title: "St. Michael's College AVC Reservation",
    tagline: 'Equipment reservations for the Audio Visual Center, with dean approval and notifications.',
    description: [
      "An Android app built for a client at St. Michael's College, Iligan City. AVC Reservation stands for Audio Visual Center Reservation.",
      'Instructors browse the equipment available and submit a reservation, which waits for approval from their dean. Once approved, the app notifies the instructor that the equipment is ready for pickup at the Audio Visual Center.',
    ],
    highlights: [
      'Browse available equipment',
      'Dean approval workflow',
      'Push notification on approval',
    ],
    tech: ['Android', 'PHP'],
    platform: 'mobile',
    cover: img('avc-reservation'),
  },
  {
    slug: 'dts',
    title: 'Document Tracking System',
    tagline: 'Store, manage and track documents, with a private chat for every document.',
    description: [
      'A web portal used to store, manage and track electronic documents and electronic images of paper-based information.',
      'Each document is assigned to specific users, and the system creates a chat session for the document that only those users can join. Every user has a designation with its own privileges, and all users can edit their own profile.',
    ],
    highlights: [
      'Document assignment per user',
      'Per-document group chat',
      'Role-based privileges',
    ],
    tech: ['PHP', 'jQuery'],
    platform: 'web',
    cover: img('dts'),
    screenshots: [
      { src: img('dts', '01.png'), caption: 'Sign in' },
      { src: img('dts', '02.png'), caption: 'All documents with status icons, deadlines and search' },
      { src: img('dts', '03.png'), caption: 'Users with their type and division' },
      { src: img('dts', '04.png'), caption: 'Divisions of the office' },
      { src: img('dts', '05.png'), caption: 'Activity log of every action taken' },
    ],
  },
  {
    slug: 'mak',
    title: 'MAK (Mobile AKAN)',
    tagline: 'Grades, enrollment and student records for MSU Marawi students, on Android.',
    description: [
      "Akan (pronounced Ak'un) is the student and employee online service of MSU Marawi campus, providing academic information such as grades, available online or through a kiosk at the College of Information Technology.",
      'This app lets students inquire about their enrollment and view and verify their grades and other records — everything the Akan kiosk does, in a more accessible and convenient way.',
    ],
    tech: ['Android', 'PHP'],
    platform: 'mobile',
    cover: img('mak'),
  },
  {
    slug: 'sig-inventory',
    title: 'SIG Online Inventory System',
    tagline: 'A web portal for tracking company inventory records, built during my internship.',
    description: [
      'A web portal I created as an intern to help the company track its inventory records.',
    ],
    tech: ['PHP', 'jQuery'],
    platform: 'web',
    cover: img('sig-inventory'),
    screenshots: [
      { src: img('sig-inventory', '01.png'), caption: 'Sign in' },
      { src: img('sig-inventory', '02.png'), caption: 'Inventory by floor: owner, location, computer, processor and RAM' },
      { src: img('sig-inventory', '03.png'), caption: 'Paged inventory list' },
      { src: img('sig-inventory', '04.png'), caption: 'Second floor tab' },
      { src: img('sig-inventory', '05.png'), caption: 'Add entry form for a computer and its monitors' },
      { src: img('sig-inventory', '06.png'), caption: 'Entry details, locked until Enable Edit is pressed' },
      { src: img('sig-inventory', '07.png'), caption: 'Print options to pick which floors to print' },
    ],
  },
  {
    slug: 'ccam',
    title: "St. Michael's College Attendance Monitoring",
    tagline: 'Classroom attendance monitoring connected to the college records server.',
    description: [
      "An Android app for a client studying at St. Michael's College, Iligan City. CCAM stands for College Classroom Attendance Monitoring.",
      'The app connects to a web server holding all information about the college, its courses and students.',
    ],
    tech: ['Android', 'PHP'],
    platform: 'mobile',
    cover: img('ccam'),
  },
  {
    slug: 'portex',
    title: 'Portex Online Examination',
    tagline: 'Online enrollment and examination portal for students and instructors.',
    description: [
      'Portex is an online examination portal my partner and I built for one of our major subjects, CSc 181N.',
      'It handles both enrollment and examinations for students and instructors in our college.',
    ],
    tech: ['PHP', 'jQuery'],
    platform: 'web',
    cover: img('portex'),
  },
];
