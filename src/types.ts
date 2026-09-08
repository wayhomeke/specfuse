export interface ProjectConfig {
  projectName: string;
  initGit: boolean;
  initOpenspec: boolean;
  targetDir: string;
  isExisting: boolean;
}

export interface TemplateContext {
  projectName: string;
}
