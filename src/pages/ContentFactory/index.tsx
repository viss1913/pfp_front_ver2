import { Navigate } from 'react-router-dom'

/** /content-factory → offers (IDE CF v1, no templates) */
export default function ContentFactoryIndex() {
  return <Navigate to="/content-factory/offers" replace />
}
