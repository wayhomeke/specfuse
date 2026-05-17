export interface StackCommands {
  build: string;
  test: string;
  lint: string;
  format?: string;
  typecheck?: string;
}

export interface StackProfile {
  id: string;
  label: string;
  languages: string[];
  framework?: string;
  architecture: string;
  commands: StackCommands;
  errorHandling: string;
  concurrency: string;
  permissions: string[];
  gitignorePatterns: string[];
  openspecContext: string;
  openspecRules: Record<string, string[]>;
}

export interface ProjectConfig {
  projectName: string;
  stack: StackProfile;
  initGit: boolean;
  initOpenspec: boolean;
  targetDir: string;
}

export interface TemplateContext {
  projectName: string;
  stack: StackProfile;
}
