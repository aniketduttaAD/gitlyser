import { MetadataRoute } from "next";

const baseUrl = "https://gitlyser.aniketdutta.space";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    }
  ];
}
