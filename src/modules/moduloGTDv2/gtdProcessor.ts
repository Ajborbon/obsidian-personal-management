// Logic for processing tasks and classifying them into GTD lists
import type { Task, ClassifiedTasks, GtdDataModel } from './model';
import { DateTime, Duration } from 'luxon'; // Use luxon for robust date/time handling

/**
 * Classifies a list of tasks into the 9 GTD lists based on their metadata.
 * @param allTasks Flat array of all Task objects.
 * @param taskMap Map of task ID to Task object for dependency checking.
 * @returns ClassifiedTasks object containing arrays for each GTD list.
 */
export function classifyTasks(allTasks: Task[], taskMap: Map<string, Task>): ClassifiedTasks {
    const classified: ClassifiedTasks = {
        inbox: [],
        nextActions: [],
        calendar: [],
        ojalaHoy: [],
        asignadas: [],
        proyectos: [],
        somedayMaybe: [],
        estaSemanaNo: [],
        enPausa: [],
        vencidas: [],
        conflictivas: [], // Store tasks identified with conflicts separately initially
    };

    const now = DateTime.now();
    const todayStr = now.toISODate(); // YYYY-MM-DD format

    console.log(`[GTDv2 Processor] Starting task classification for ${allTasks.length} tasks. Today is ${todayStr}.`);

    for (const task of allTasks) {
        // Reset potential conflicts for re-evaluation
        task.conflicts = [];
        task.gtdList = undefined; // Reset classification

        // --- Initial Checks & Conflict Detection ---
        // TODO: Implement conflict detection (e.g., time inconsistencies)
        // If conflicts are found, add to task.conflicts and push to classified.conflictivas

        // --- GTD List Classification Logic ---
        // Apply rules in a specific order of precedence or exclusivity

        // 1. Someday/Maybe (#GTD-AlgunDia) - Exclusive
        if (task.tags.includes('#GTD-AlgunDia')) {
            task.gtdList = 'Someday/Maybe';
            classified.somedayMaybe.push(task);
            continue; // Skip other classifications
        }

        // 2. Esta Semana No (#GTD-EstaSemanaNo) - Exclusive
        if (task.tags.includes('#GTD-EstaSemanaNo')) {
            task.gtdList = 'Esta Semana No';
            classified.estaSemanaNo.push(task);
            continue; // Skip other classifications
        }

        // 3. En Pausa (Future Start Date 🛫, Dependency ⛔, Future Week [w::]) - Exclusive
        let isOnPause = false;
        // Check future start date
        if (task.startDate) {
            const startDt = DateTime.fromISO(task.startDate);
            if (startDt.isValid && startDt > now) {
                task.gtdList = 'En Pausa';
                classified.enPausa.push(task);
                isOnPause = true;
            }
        }
        // Check dependency (if not already paused by date)
        if (!isOnPause && task.dependsOn) {
            const dependentTask = taskMap.get(task.dependsOn);
            // Pause if dependent task exists and is not completed ('x')
            if (dependentTask && dependentTask.status !== 'x') {
                task.gtdList = 'En Pausa';
                classified.enPausa.push(task);
                isOnPause = true;
            }
        }
        // Check future week (if not already paused)
        // TODO: Implement week parsing and comparison logic
        if (!isOnPause && task.week) {
             // const weekDt = parseWeek(task.week); // Helper needed
             // if (weekDt.isValid && weekDt > now.startOf('week')) {
             //    task.gtdList = 'En Pausa';
             //    classified.enPausa.push(task);
             //    isOnPause = true;
             // }
        }
        if (isOnPause) continue; // Skip other classifications if paused

        // 4. Calendar (📅 with [hI::]) - Exclusive
        if (task.dueDate && task.startTime) {
            // TODO: Add validation for startTime format
            task.gtdList = 'Calendar';
            classified.calendar.push(task);
            continue; // Skip other classifications
        }

        // 5. Proyectos (#cx-ProyectoGTD or #cx-Entregable) - Can overlap? Let's assume exclusive for now.
        if (task.contexts.includes('#cx-ProyectoGTD') || task.contexts.includes('#cx-Entregable')) {
            task.gtdList = 'Proyectos';
            classified.proyectos.push(task);
            continue; // Skip other classifications
        }

        // 6. Asignadas (#px- present, #cx- absent) - Not exclusive if dated
        let isAsignada = false;
        if (task.assignedPersons.length > 0 && task.contexts.length === 0) {
            task.gtdList = 'Asignadas'; // Primary classification
            classified.asignadas.push(task);
            isAsignada = true;
            // DO NOT continue; - Allow checking for Ojalá Hoy / Vencidas
        }

        // 7. Next Actions (#cx- present) - Can have #px- simultaneously
        // Also includes tasks whose start date 🛫 is today/past, or week [w::] is current/past
        let isNextAction = false;
        if (task.contexts.length > 0) {
            isNextAction = true;
        }
        if (!isNextAction && task.startDate) {
             const startDt = DateTime.fromISO(task.startDate);
             if (startDt.isValid && startDt <= now) {
                 // Requires context or assignment to become Next Action/Asignada upon reaching start date
                 // If neither, should it go to Inbox? Yes, according to rules.
                 if (task.contexts.length > 0) isNextAction = true;
                 // If only assigned, it should have been caught by rule 6 after date passed.
             }
        }
        // TODO: Add logic for current/past week [w::] triggering Next Actions (if context exists)

        if (isNextAction) {
            task.gtdList = 'Next Actions';
            classified.nextActions.push(task);
            // Don't continue, might also qualify for Ojalá Hoy
        }

        // 8. Ojalá Hoy / Vencidas (📅 or ⏳ for today/past, NO [hI::])
        // Also includes assigned tasks with relevant dates.
        let isOjalaHoy = false;
        let isVencida = false;
        const relevantDate = task.dueDate ?? task.scheduledDate; // Due takes precedence

        if (relevantDate && !task.startTime) { // Must have a date, but not a specific time (that's Calendar)
            const dateDt = DateTime.fromISO(relevantDate);
            if (dateDt.isValid) {
                if (dateDt.hasSame(now, 'day')) {
                    // Qualifies for Ojalá Hoy
                    // Add if it's a Next Action OR an Asignada task
                    if (task.gtdList === 'Next Actions' || isAsignada) {
                        // Avoid duplicates if already added via Next Actions path
                        if (!classified.ojalaHoy.includes(task)) {
                            classified.ojalaHoy.push(task);
                        }
                        // Set gtdList to Ojalá Hoy if not already set, or keep Next Actions/Asignadas?
                        // Let's keep the primary classification (Next Action/Asignada) but ensure it appears here.
                        isOjalaHoy = true;
                    } else if (!task.gtdList) { // If not classified yet, it's primarily Ojalá Hoy
                        task.gtdList = 'Ojalá Hoy';
                        classified.ojalaHoy.push(task);
                        isOjalaHoy = true;
                    }
                } else if (dateDt < now.startOf('day')) {
                    // Qualifies for Vencidas
                    task.isOverdue = true; // Mark as overdue
                    // Add if it's a Next Action OR an Asignada task
                    if (task.gtdList === 'Next Actions' || isAsignada) {
                         // Avoid duplicates if already added via Next Actions path? (Shouldn't happen based on logic order)
                         if (!classified.vencidas.includes(task)) {
                             classified.vencidas.push(task);
                         }
                         isVencida = true;
                    } else if (task.contexts.length === 0 && task.assignedPersons.length === 0) {
                         // Overdue task without context/assignment -> Inbox conflict
                         task.conflicts = task.conflicts ?? [];
                         task.conflicts.push('Overdue task without context/assignment');
                         // Don't add to Vencidas directly, let Inbox handle it
                    } else if (!task.gtdList) {
                        // If it wasn't Next Action or Asignada, but has context/assignment (implicit from above check)
                        // This case seems unlikely given the order, but capture just in case.
                        // Should probably go to Inbox if it reached here without classification.
                        task.conflicts = task.conflicts ?? [];
                        task.conflicts.push('Overdue task with unexpected state');
                    }
                }
                // Future dates are handled by "En Pausa" if 🛫, or ignored here if 📅/⏳
            }
        }

        // 9. Inbox (Default/Fallback and specific cases)
        // If a task hasn't been classified yet, or has conflicts, it goes to Inbox.
        let requiresInbox = task.gtdList === undefined && !isOjalaHoy && !isVencida; // Not classified, not today, not overdue

        // Specific Inbox criteria:
        if (task.tags.includes('#inbox')) requiresInbox = true;
        // Add tasks with conflicts to Inbox for review
        if (task.conflicts && task.conflicts.length > 0) requiresInbox = true;

        // TODO: Add other Inbox checks (partially processed, incorrect formats, etc.)

        if (requiresInbox) {
             // Ensure it's not already in another primary list (except potentially Asignadas/NextActions which can co-exist in date lists)
             const alreadyInPrimaryList = classified.calendar.includes(task) ||
                                         classified.proyectos.includes(task) ||
                                         classified.somedayMaybe.includes(task) ||
                                         classified.estaSemanaNo.includes(task) ||
                                         classified.enPausa.includes(task);

             if (!alreadyInPrimaryList && !classified.inbox.includes(task)) {
                 task.gtdList = task.gtdList ?? 'Inbox'; // Assign Inbox if no other primary list assigned
                 classified.inbox.push(task);
             } else if (alreadyInPrimaryList && task.conflicts && task.conflicts.length > 0 && !classified.inbox.includes(task)) {
                 // If it's in a primary list BUT has conflicts, also add to Inbox for review
                 classified.inbox.push(task);
             }
        }

    } // End of task loop

    // TODO: Post-processing: Handle tasks marked as conflictivas? Maybe merge them into Inbox?

    console.log(`[GTDv2 Processor] Classification complete. Inbox: ${classified.inbox.length}, Next: ${classified.nextActions.length}, Calendar: ${classified.calendar.length}, ...`);

    return classified;
}

// --- Helper Functions ---

// TODO: Implement robust helper functions for:
// - Parsing time strings (e.g., "3pm", "15:00") -> return consistent format or DateTime object
// - Parsing week strings "YYYY-WXX" -> return DateTime object
// - Calculating duration based on start/end times
// - Checking time conflicts (end before start, duration mismatch)
