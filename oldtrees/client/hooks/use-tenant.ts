import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTenantByDomain, getCurrentUser } from "@/lib/api";

export function useTenant() {
  const { tenantId: urlTenantId } = useParams<{ tenantId: string }>();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTenant = async () => {
      try {
        setLoading(true);

        // First, try to get tenantId from URL parameters
        if (urlTenantId) {
          setTenantId(urlTenantId);
          setDomain(window.location.hostname);
          setError(null);
          return;
        }

        // Then, try to get tenantId from current user in localStorage
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.tenantId) {
          setTenantId(currentUser.tenantId);
          setDomain(window.location.hostname);
          setError(null);
          return;
        }

        // Finally, try domain-based lookup (for public storefronts)
        const currentDomain = window.location.hostname;
        setDomain(currentDomain);

        const response = await getTenantByDomain(currentDomain);
        setTenantId(response.data.id);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load tenant";
        setError(errorMsg);
        console.error("Failed to load tenant from domain:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, [urlTenantId]);

  return { tenantId, domain, loading, error };
}
