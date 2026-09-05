import { Helmet } from "react-helmet-async";

interface Props {
  title: string;
  description?: string;
  canonical: string;
  image?: string;
  jsonLd?: object | object[];
}

export function TenantSeo({ title, description, canonical, image, jsonLd }: Props) {
  const url = canonical.startsWith("http") ? canonical : `https://solutionaryhq.com${canonical}`;
  const ldArr = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      {ldArr.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
