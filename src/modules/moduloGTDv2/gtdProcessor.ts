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

        // 6. Asignadas (#px- present, #cx- absent) - Exclusive
        if (task.assignedPersons.length > 0 && task.contexts.length === 0) {
            task.gtdList = 'Asignadas';
            classified.asignadas.push(task);
            continue; // Skip other classifications
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

        // 8. Ojalá Hoy (📅 or ⏳ for today, NO [hI::])
        let isOjalaHoy = false;
        const relevantDate = task.dueDate ?? task.scheduledDate;
        if (relevantDate && !task.startTime) {
            const dateDt = DateTime.fromISO(relevantDate);
            if (dateDt.isValid) {
                if (dateDt.hasSame(now, 'day')) {
                    task.gtdList = task.gtdList ?? 'Ojalá Hoy'; // Assign if not already Next Action
                    classified.ojalaHoy.push(task);
                    isOjalaHoy = true;
                } else if (dateDt < now.startOf('day')) {
                    // Overdue 'Ojalá Hoy' tasks
                    task.isOverdue = true;
                    // If it has context or assignment, it should appear in Vencidas
                    // If not, it goes to Inbox as well.
                    if (task.contexts.length > 0 || task.assignedPersons.length > 0) {
                         classified.vencidas.push(task);
                    }
                    // Also add to Inbox if no context/assignment
                    if (task.contexts.length === 0 && task.assignedPersons.length === 0) {
                        // Mark for Inbox addition later
                        task.conflicts = task.conflicts ?? [];
                        task.conflicts.push('Overdue task without context/assignment');
                    }
                }
                // Future dates are handled by "En Pausa" if 🛫, or ignored here if 📅/⏳
            }
        }

        // 9. Inbox (Default/Fallback and specific cases)
        // If a task hasn't been classified yet, or has conflicts, it goes to Inbox.
        let requiresInbox = task.gtdList === undefined;

        // Specific Inbox criteria from prompt:
        if (task.tags.includes('#inbox')) requiresInbox = true;
        if (!task.tags || task.tags.length === 0) { // Approximation for "no tags or specific metadata"
             // Be careful, this might catch too many things. Refine if needed.
             // Let's rely on other rules first. If it falls through, it's likely Inbox.
        }
        // TODO: Add checks for partially processed, incorrect formats, conflicting times, past week without context.

        if (requiresInbox || (task.conflicts && task.conflicts.length > 0)) {
             // Avoid double-adding if already added to Vencidas but also needs Inbox review
             if (!classified.vencidas.includes(task)) {
                 task.gtdList = 'Inbox';
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
