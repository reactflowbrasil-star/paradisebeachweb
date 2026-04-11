import { useQuery } from "@tanstack/react-query";
import { api, type CmsContentItem, type CmsMenuItem, type CmsSection, type PublicPagePayload } from "@/lib/api";

export function usePublicPage(slug: string) {
  return useQuery({
    queryKey: ["cms-page", slug],
    queryFn: () => api.getPublicPage(slug),
    staleTime: 60_000,
  });
}

export function usePublicMenu(menuKey = "main") {
  return useQuery({
    queryKey: ["cms-menu", menuKey],
    queryFn: () => api.getPublicMenu(menuKey),
    staleTime: 60_000,
  });
}

export function usePublicSiteSettings() {
  return useQuery({
    queryKey: ["cms-site-settings"],
    queryFn: () => api.getPublicSiteSettings(),
    staleTime: 60_000,
  });
}

export function findSection(payload: PublicPagePayload | undefined, sectionKey: string) {
  return payload?.sections.find((section) => section.section_key === sectionKey);
}

export function findSectionItems(section: CmsSection | (CmsSection & { items?: CmsContentItem[] }) | undefined) {
  return (section && "items" in section ? section.items || [] : []) as CmsContentItem[];
}

export function findContentItem(items: CmsContentItem[] | undefined, contentKey: string) {
  return items?.find((item) => item.content_key === contentKey);
}

export function flattenMenu(items: CmsMenuItem[] | undefined): CmsMenuItem[] {
  if (!items) return [];
  const output: CmsMenuItem[] = [];
  const visit = (entry: CmsMenuItem) => {
    output.push(entry);
    (entry.children || []).forEach(visit);
  };
  items.forEach(visit);
  return output;
}
