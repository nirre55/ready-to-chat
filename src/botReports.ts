import type { AppConfig } from "./config.js";
import type { ProjectsConfig } from "./projectConfig.js";
import {
  runCommandForAllProjects,
  runCommandsForAllProjects,
  type ProjectTaskReport,
} from "./taskRunner.js";

export type ProjectReport = ProjectTaskReport;

export function getBalanceReports(
  config: AppConfig,
  projectsConfig: ProjectsConfig,
): Promise<ProjectReport[]> {
  return runCommandForAllProjects(config, projectsConfig, "balance");
}

export function getSummaryReports(
  config: AppConfig,
  projectsConfig: ProjectsConfig,
): Promise<ProjectReport[]> {
  return runCommandForAllProjects(config, projectsConfig, "summary");
}

export function getAllReports(
  config: AppConfig,
  projectsConfig: ProjectsConfig,
): Promise<ProjectReport[]> {
  return runCommandsForAllProjects(config, projectsConfig, ["balance", "summary"]);
}
