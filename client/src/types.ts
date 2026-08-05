export interface Message {
  id: string;
  role: "user" | "ezer";
  content: string;
  loading?: boolean;
}

export interface InfoPill {
  id: string;
  label: string;
  icon: unknown;
}
