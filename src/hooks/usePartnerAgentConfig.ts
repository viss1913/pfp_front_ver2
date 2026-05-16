import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { adminManagementAPI } from '@/lib/api'
import { getPartnerAgentIdConfig, type PartnerAgentIdConfig } from '@/lib/partnerAgent'

export function usePartnerAgentConfig(): PartnerAgentIdConfig {
  const { activeProject, user } = useAuth()
  const [config, setConfig] = useState<PartnerAgentIdConfig>(() =>
    getPartnerAgentIdConfig(activeProject?.settings)
  )

  useEffect(() => {
    let cancelled = false
    setConfig(getPartnerAgentIdConfig(activeProject?.settings))

    if (user?.role === 'super_admin' && activeProject?.id) {
      adminManagementAPI
        .getProject(activeProject.id)
        .then((project) => {
          if (!cancelled) {
            setConfig(getPartnerAgentIdConfig(project.settings))
          }
        })
        .catch(() => {})
    }

    return () => {
      cancelled = true
    }
  }, [activeProject?.id, activeProject?.settings, user?.role])

  return config
}
