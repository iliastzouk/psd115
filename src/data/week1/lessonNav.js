/**
 * Πλοήγηση ενοτήτων Εβδομάδας 1 — τίτλοι ίδιοι με το H1 κάθε σελίδας / lesson object.
 */
import { definitionLesson } from './definitionPsychology.js'
import { philosophers } from './philosophers.js'
import { wundtLesson } from './wundt.js'
import { functionalismLesson } from './functionalism.js'
import { clinicalLesson } from './clinicalPsychology.js'
import { psychoanalysisLesson } from './psychoanalysis.js'
import { humanisticLesson } from './humanisticPsychology.js'
import { behaviorismLesson } from './behaviorism.js'
import { pavlovLesson } from './pavlov.js'
import { littleAlbertLesson } from './littleAlbert.js'
import { thorndikeLesson } from './thorndike.js'
import { skinnerLesson } from './skinner.js'
import { cognitiveLesson } from './cognitive.js'
import { chomskyLesson } from './chomsky.js'
import { neuroscienceIntro } from './neuroscience.js'
import { gestaltLesson } from './gestalt.js'
import { evolutionaryLesson } from './evolutionary.js'
import { socialPsychologyLesson } from './socialPsychology.js'
import { educationalPsychologyLesson } from './educationalPsychology.js'
import { otherBranchesLesson } from './otherBranches.js'

/** @type {{ to: string, title: string }[]} */
export const WEEK1_LESSON_NAV = [
  { to: '/week/1/definition', title: definitionLesson.title },
  { to: '/week/1/philosophers', title: philosophers.title },
  { to: '/week/1/wundt', title: wundtLesson.title },
  { to: '/week/1/functionalism', title: functionalismLesson.title },
  { to: '/week/1/clinical', title: clinicalLesson.title },
  { to: '/week/1/psychoanalysis', title: psychoanalysisLesson.title },
  { to: '/week/1/humanistic', title: humanisticLesson.title },
  { to: '/week/1/behaviorism', title: behaviorismLesson.title },
  { to: '/week/1/pavlov', title: pavlovLesson.title },
  { to: '/week/1/little-albert', title: littleAlbertLesson.title },
  { to: '/week/1/thorndike', title: thorndikeLesson.title },
  { to: '/week/1/skinner', title: skinnerLesson.title },
  { to: '/week/1/cognitive', title: cognitiveLesson.title },
  { to: '/week/1/chomsky', title: chomskyLesson.title },
  { to: '/week/1/neuroscience', title: neuroscienceIntro.title },
  { to: '/week/1/gestalt', title: gestaltLesson.title },
  { to: '/week/1/evolutionary', title: evolutionaryLesson.title },
  { to: '/week/1/social-psychology', title: socialPsychologyLesson.title },
  { to: '/week/1/educational-psychology', title: educationalPsychologyLesson.title },
  { to: '/week/1/other-branches', title: otherBranchesLesson.title },
]
