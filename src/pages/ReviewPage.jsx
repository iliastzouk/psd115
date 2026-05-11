import { useOutletContext } from 'react-router-dom'
import WrongAnswersReview from '../components/WrongAnswersReview.jsx'

export default function ReviewPage() {
  const { progress, clearWrongBook, removeWrongOne } = useOutletContext()
  return <WrongAnswersReview items={progress.wrongBook} onClear={clearWrongBook} onClearOne={removeWrongOne} />
}
