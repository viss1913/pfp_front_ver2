import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { isSuperAdmin } from '@/lib/authUser'
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

    if (isSuperAdmin(user?.role) && activeProject?.id) {
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
