/**
 * PSD115: αντιστοίχιση ταυτοτήτων (unit / topic) στα ΥΠΑΡΧΟΝΤΑ components. Ρητοί πίνακες.
 * Τα custom μαθήματα της Εβδ. 1 μένουν όπως είναι (κανένας γενικός renderer σε αυτό το phase).
 */
import Week1Layout from '../Week1Layout.jsx'
import Week1Home from '../Week1Home.jsx'
import Week2Layout from '../Week2Layout.jsx'
import Week2Home from '../Week2Home.jsx'
import Week2TopicPage from '../Week2TopicPage.jsx'
import Week3Layout from '../Week3Layout.jsx'
import Week3Home from '../Week3Home.jsx'
import Week3TopicPage from '../Week3TopicPage.jsx'
import Week4Layout from '../Week4Layout.jsx'
import Week4Home from '../Week4Home.jsx'
import Week4TopicPage from '../Week4TopicPage.jsx'
import DefinitionPage from '../DefinitionPage.jsx'
import PhilosophersPage from '../PhilosophersPage.jsx'
import WundtPage from '../WundtPage.jsx'
import FunctionalismPage from '../FunctionalismPage.jsx'
import ClinicalPsychologyPage from '../ClinicalPsychologyPage.jsx'
import PsychoanalysisPage from '../PsychoanalysisPage.jsx'
import HumanisticPsychologyPage from '../HumanisticPsychologyPage.jsx'
import BehaviorismPage from '../BehaviorismPage.jsx'
import PavlovPage from '../PavlovPage.jsx'
import LittleAlbertPage from '../LittleAlbertPage.jsx'
import ThorndikePage from '../ThorndikePage.jsx'
import SkinnerPage from '../SkinnerPage.jsx'
import CognitivePage from '../CognitivePage.jsx'
import ChomskyPage from '../ChomskyPage.jsx'
import NeurosciencePage from '../NeurosciencePage.jsx'
import GestaltPage from '../GestaltPage.jsx'
import EvolutionaryPage from '../EvolutionaryPage.jsx'
import SocialPsychologyPage from '../SocialPsychologyPage.jsx'
import EducationalPsychologyPage from '../EducationalPsychologyPage.jsx'
import OtherBranchesPage from '../OtherBranchesPage.jsx'
import {
  WEEK1_CATEGORIES,
  WEEK2_CATEGORIES,
  WEEK3_CATEGORIES,
  WEEK4_CATEGORIES,
} from '../../../content/courses/psd115/questions.js'

/** Σελίδες θεμάτων Εβδ. 1, ανά legacySlug (όπως οι παλιές διαδρομές /week/1/<slug>). */
const WEEK1_TOPIC_PAGES = {
  definition: DefinitionPage,
  philosophers: PhilosophersPage,
  wundt: WundtPage,
  functionalism: FunctionalismPage,
  clinical: ClinicalPsychologyPage,
  psychoanalysis: PsychoanalysisPage,
  humanistic: HumanisticPsychologyPage,
  behaviorism: BehaviorismPage,
  pavlov: PavlovPage,
  'little-albert': LittleAlbertPage,
  thorndike: ThorndikePage,
  skinner: SkinnerPage,
  cognitive: CognitivePage,
  chomsky: ChomskyPage,
  neuroscience: NeurosciencePage,
  gestalt: GestaltPage,
  evolutionary: EvolutionaryPage,
  'social-psychology': SocialPsychologyPage,
  'educational-psychology': EducationalPsychologyPage,
  'other-branches': OtherBranchesPage,
}

const SLUG_TOPIC_PAGES = { k2: Week2TopicPage, k3: Week3TopicPage, k4: Week4TopicPage }

export const PSD115_UI = {
  layouts: { k1: Week1Layout, k2: Week2Layout, k3: Week3Layout, k4: Week4Layout },
  homes: { k1: Week1Home, k2: Week2Home, k3: Week3Home, k4: Week4Home },
  categories: { k1: WEEK1_CATEGORIES, k2: WEEK2_CATEGORIES, k3: WEEK3_CATEGORIES, k4: WEEK4_CATEGORIES },
  /** @returns {JSX.Element | null} */
  topicElement(unitId, legacySlug) {
    if (unitId === 'k1') {
      const Page = WEEK1_TOPIC_PAGES[legacySlug]
      return Page ? <Page /> : null
    }
    const Page = SLUG_TOPIC_PAGES[unitId]
    return Page ? <Page slug={legacySlug} /> : null
  },
}

export const UI_BY_COURSE = { psd115: PSD115_UI }
