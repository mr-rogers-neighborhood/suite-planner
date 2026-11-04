import type { LoroDoc } from "loro-crdt";

import type {
  CalendarEvent,
  DayRecord,
  FocusSession,
  Project,
  Settings,
  Tag,
  Task,
  WorkspaceMeta,
} from "../schema";
import { listDays } from "./days";
import { listEvents } from "./events";
import { listFocusSessions } from "./focus";
import { readMeta } from "./meta";
import { listProjects } from "./projects";
import { readSettings } from "./settings";
import { listTags } from "./tags";
import { listTasks } from "./tasks";

export type WorkspaceSnapshot = {
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
  events: CalendarEvent[];
  days: DayRecord[];
  focusSessions: FocusSession[];
  settings: Settings;
  meta: WorkspaceMeta;
};

export function readWorkspaceSnapshot(doc: LoroDoc): WorkspaceSnapshot {
  return {
    tasks: listTasks(doc),
    projects: listProjects(doc),
    tags: listTags(doc),
    events: listEvents(doc),
    days: listDays(doc),
    focusSessions: listFocusSessions(doc),
    settings: readSettings(doc),
    meta: readMeta(doc),
  };
}
