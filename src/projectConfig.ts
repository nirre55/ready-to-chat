import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type ProjectCommand = {
  label: string;
  command?: string;
  args?: string[];
  shell?: string;
  env?: Record<string, string>;
};

export type ProjectDefinition = {
  id: string;
  name: string;
  path: string;
  commands: Record<string, ProjectCommand>;
};

export type ProjectsConfig = {
  projects: ProjectDefinition[];
};

export function loadProjectsConfig(configPath: string): ProjectsConfig {
  const fullPath = resolve(configPath);
  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(fullPath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to load projects config at ${fullPath}: ${message}`);
  }

  return parseProjectsConfig(parsed);
}

export function parseProjectsConfig(value: unknown): ProjectsConfig {
  if (!isRecord(value) || !Array.isArray(value.projects)) {
    throw new Error("projects config must contain a projects array");
  }

  const projectIds = new Set<string>();
  const projects = value.projects.map((project, index) =>
    parseProject(project, index, projectIds),
  );

  if (projects.length === 0) {
    throw new Error("projects config must contain at least one project");
  }

  return { projects };
}

function parseProject(
  value: unknown,
  index: number,
  projectIds: Set<string>,
): ProjectDefinition {
  if (!isRecord(value)) {
    throw new Error(`project at index ${index} must be an object`);
  }

  const id = requiredString(value.id, `project at index ${index} id`);
  if (projectIds.has(id)) {
    throw new Error(`duplicate project id: ${id}`);
  }
  projectIds.add(id);

  const name = requiredString(value.name, `project ${id} name`);
  const path = requiredString(value.path, `project ${id} path`);

  if (!isRecord(value.commands)) {
    throw new Error(`project ${id} commands must be an object`);
  }

  const commands = parseCommands(id, value.commands);

  return {
    id,
    name,
    path,
    commands,
  };
}

function parseCommands(
  projectId: string,
  value: Record<string, unknown>,
): Record<string, ProjectCommand> {
  const commandEntries = Object.entries(value);

  if (commandEntries.length === 0) {
    throw new Error(`project ${projectId} must define at least one command`);
  }

  return Object.fromEntries(
    commandEntries.map(([commandId, command]) => [
      requiredString(commandId, `project ${projectId} command id`),
      parseCommand(projectId, commandId, command),
    ]),
  );
}

function parseCommand(projectId: string, commandId: string, value: unknown): ProjectCommand {
  if (!isRecord(value)) {
    throw new Error(`command ${projectId}.${commandId} must be an object`);
  }

  const label = requiredString(value.label, `command ${projectId}.${commandId} label`);
  const command = optionalString(value.command, `command ${projectId}.${commandId} command`);
  const shell = optionalString(value.shell, `command ${projectId}.${commandId} shell`);

  if (command && shell) {
    throw new Error(`command ${projectId}.${commandId} cannot define both command and shell`);
  }

  if (!command && !shell) {
    throw new Error(`command ${projectId}.${commandId} must define command or shell`);
  }

  return {
    label,
    command,
    shell,
    args: parseArgs(projectId, commandId, value.args),
    env: parseEnv(projectId, commandId, value.env),
  };
}

function parseArgs(projectId: string, commandId: string, value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`command ${projectId}.${commandId} args must be an array of strings`);
  }

  return value;
}

function parseEnv(
  projectId: string,
  commandId: string,
  value: unknown,
): Record<string, string> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value) || !Object.values(value).every((item) => typeof item === "string")) {
    throw new Error(`command ${projectId}.${commandId} env must be an object of strings`);
  }

  return value as Record<string, string>;
}

function requiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required`);
  }

  return value.trim();
}

function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be a non-empty string`);
  }

  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
