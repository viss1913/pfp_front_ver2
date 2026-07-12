import { Navigate } from 'react-router-dom'

/** /content-factory → templates */
export default function ContentFactoryIndex() {
  return <Navigate to="/content-factory/templates" replace />
}
