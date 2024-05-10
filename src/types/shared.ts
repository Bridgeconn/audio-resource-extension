export type ResourceDisplay<FullResource> = {
  id: string;
  name: string;
  version: {
    tag: string;
    releaseDate: Date;
  };
  owner: {
    name: string;
    url: string;
    avatarUrl: string;
  };
  fullResource: FullResource;
  resourceType: string;
};
