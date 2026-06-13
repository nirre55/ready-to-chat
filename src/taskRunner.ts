import type { AppConfig } from "./config.js";
import { runCommand, type CommandResult } from "./commandRunner.js";
import type { ProjectCommand, ProjectDefinition, ProjectsConfig } from "./projectConfig.js";

export type TaskResult = {
  projectId: string;
  projectName: string;
  projectPath: string;
  commandId: string;
  commandLabel: string;
  status: "completed" | "skipped";
  result?: CommandResult;
  skippedReason?: string;
};

export type ProjectTaskReport = {
  projectId: string;
  projectName: string;
  projectPath: string;
  sections: TaskResult[];
};

export async function runProjectCommand(
  appConfig: AppConfig,
  projectsConfig: ProjectsConfig,
  projectId: string,
  commandId: string,
): Promise<ProjectTaskReport[]> {
  const project = projectsConfig.projects.find((candidate) => candidate.id === projectId);

  if (!project) {
    throw new Error(`Unknown project id: ${projectId}`);
  }

  return [
    {
      projectId: project.id,
      projectName: project.name,
      projectPath: project.path,
      sections: [await runCommandForProject(appConfig, project, commandId)],
    },
  ];
}

export async function runCommandForAllProjects(
  appConfig: AppConfig,
  projectsConfig: ProjectsConfig,
  commandId: string,
): Promise<ProjectTaskReport[]> {
  const reports: ProjectTaskReport[] = [];

  for (const project of projectsConfig.projects) {
    reports.push({
      projectId: project.id,
      projectName: project.name,
      projectPath: project.path,
      sections: [await runCommandForProject(appConfig, project, commandId)],
    });
  }

  return reports;
}

export async function runCommandsForAllProjects(
  appConfig: AppConfig,
  projectsConfig: ProjectsConfig,
  commandIds: string[],
): Promise<ProjectTaskReport[]> {
  const reports: ProjectTaskReport[] = [];

  for (const project of projectsConfig.projects) {
    const sections: TaskResult[] = [];

    for (const commandId of commandIds) {
      sections.push(await runCommandForProject(appConfig, project, commandId));
    }

    reports.push({
      projectId: project.id,
      projectName: project.name,
      projectPath: project.path,
      sections,
    });
  }

  return reports;
}

async function runCommandForProject(
  appConfig: AppConfig,
  project: ProjectDefinition,
  commandId: string,
): Promise<TaskResult> {
  const command = project.commands[commandId];

  if (!command) {
    return {
      projectId: project.id,
      projectName: project.name,
      projectPath: project.path,
      commandId,
      commandLabel: commandId,
      status: "skipped",
      skippedReason: `Project does not define command: ${commandId}`,
    };
  }

  return {
    projectId: project.id,
    projectName: project.name,
    projectPath: project.path,
    commandId,
    commandLabel: command.label,
    status: "completed",
    result: await executeConfiguredCommand(appConfig, project, command),
  };
}

function executeConfiguredCommand(
  appConfig: AppConfig,
  project: ProjectDefinition,
  command: ProjectCommand,
): Promise<CommandResult> {
  if (command.shell) {
    return runCommand({
      cwd: project.path,
      command: command.shell,
      env: buildEnv(appConfig, command),
      timeoutMs: appConfig.commandTimeoutMs,
      shell: true,
    });
  }

  return runCommand({
    cwd: project.path,
    command: command.command ?? "",
    args: command.args,
    env: buildEnv(appConfig, command),
    timeoutMs: appConfig.commandTimeoutMs,
  });
}

function buildEnv(appConfig: AppConfig, command: ProjectCommand): NodeJS.ProcessEnv {
  return {
    EXECUTION_MODE: appConfig.executionMode,
    ...command.env,
  };
}
