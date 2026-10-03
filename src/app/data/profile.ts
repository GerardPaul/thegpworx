export type SocialName = 'email' | 'linkedin' | 'facebook' | 'instagram' | 'youtube';

export const profile = {
  name: 'Gerard Paul Labitad',
  firstName: 'Gerard',
  role: 'Web Developer',
  brand: 'TheGPWorx',
  tagline: ['Gunpla', 'Games', 'More'],
  intro:
    "I'm a full-stack web developer from Batangas, Philippines, turning ideas into fast, friendly web apps since 2012. " +
    'Angular on the front, Laravel on the back — and Gunpla kits and video games on the side.',
  // Shown in the Skills grid, in this order. Names must match keys in data/tech.ts to get a logo.
  skills: ['PHP', 'Laravel', 'HTML', 'JavaScript', 'Angular', 'MySQL', 'CSS', 'Tailwind CSS', 'Photoshop', 'Git', 'Android', 'React Native', 'React'],
  contactBlurb:
    "Have a project in mind or just want to say hello? I'm always open to new ideas, opportunities and collaborations.",
  email: 'gerardpaul.labitad19@gmail.com',
  socials: [
    { name: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/thegpworx/' },
    { name: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/thegpworx' },
    { name: 'instagram', label: 'Instagram', url: 'https://instagram.com/theGPWorx' },
    { name: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@TheGPWorx' },
  ] as { name: SocialName; label: string; url: string }[],
};
