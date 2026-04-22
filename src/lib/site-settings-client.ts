type SiteSettings = {
  siteLogo: string;
  siteFavicon: string;
};

let settingsPromise: Promise<SiteSettings> | null = null;

export async function getSiteSettingsClient(): Promise<SiteSettings> {
  if (!settingsPromise) {
    settingsPromise = fetch("/api/site-settings")
      .then((res) => (res.ok ? res.json() : { siteLogo: "", siteFavicon: "" }))
      .then((data) => ({
        siteLogo: data?.siteLogo || "",
        siteFavicon: data?.siteFavicon || "",
      }))
      .catch(() => ({ siteLogo: "", siteFavicon: "" }));
  }

  return settingsPromise;
}
