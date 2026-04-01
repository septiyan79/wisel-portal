export type NavItem = {
  label: string;
  sub: string[];
};

export type HeroTab = {
  label: string;
  icon: string;
  href: string;
};

export type Category = {
  label: string;
  desc: string;
  icon: string;
  from: string;
  to: string;
};

export type Stat = {
  value: string;
  label: string;
};

export type Resource = {
  tag: string;
  type: string;
  icon: string;
  title: string;
  desc: string;
  cta: string;
  accent: string;
  tagColor: string;
};