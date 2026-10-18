const avatar = (file) => `${import.meta.env?.BASE_URL || "./"}avatars/${file}`;

export const TEAM = [
  { slug: "ying", name: "YING", avatar: avatar("ying.png"), position: [0, 0, 0], featured: true },
  { slug: "shellmega", name: "Shellmega", avatar: avatar("shellmega.png"), position: [-6, 3.2, -1.4] },
  { slug: "yuanmouren", name: "袁谋人", avatar: avatar("yuanmouren.png"), position: [-2.7, 4.6, 1.3] },
  { slug: "elephantation", name: "Elephantation", avatar: avatar("elephantation.png"), position: [3.2, 4.1, -2.1] },
  { slug: "lnfer", name: "lnfer", avatar: avatar("lnfer.png"), position: [6.2, 1.7, 1.2] },
  { slug: "jiran", name: "计然", avatar: avatar("jiran.png"), position: [5.2, -2.6, -1.8] },
  { slug: "s7", name: "s7", avatar: avatar("s7.png"), position: [2.5, -4.2, 1.9] },
  { slug: "speraymer", name: "Speraymer", avatar: avatar("speraymer.png"), position: [-1.9, -4.5, -0.7] },
  { slug: "zhengfu199", name: "zhengfu199", avatar: avatar("zhengfu199.png"), position: [-5.3, -2.5, 1.2] },
  { slug: "elros", name: "Elros.", avatar: avatar("elros.png"), position: [-6.7, 0.4, -2.3] },
];
