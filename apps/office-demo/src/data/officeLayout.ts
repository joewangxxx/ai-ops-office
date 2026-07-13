import officeLayoutJson from '../../../../docs/office-layout.json';

export type ScenePoint = {
  x: number;
  y: number;
};

export type RenderSize = {
  width: number;
  height: number;
};

export type Scene = {
  assetKey: string;
  path: string;
  width: number;
  height: number;
};

export type AnchoredAsset = {
  path: string;
  recommendedRenderSize: RenderSize;
};

export type FurnitureAsset = AnchoredAsset & {
  visualBottomCenterSource: ScenePoint;
};

export type OrbAsset = AnchoredAsset & {
  visualCenterSource: ScenePoint;
};

export type AvatarPoseAsset = {
  path: string;
  visualFootShadowCenterSource: ScenePoint;
};

export type DeskDefinition = {
  id: string;
  workspaceId: string;
  deskAnchor: ScenePoint;
  occupant: {
    id: string;
    displayName: string;
    avatarKey: string | null;
    nameTagColor: string;
  };
  avatarAnchor: ScenePoint;
  nameTagAnchor: ScenePoint;
  orbAnchor: ScenePoint;
  online: boolean;
};

export type WorkspaceDefinition = {
  id: string;
  name: string;
  bounds: ScenePoint & RenderSize;
  safePlacementBounds: ScenePoint & RenderSize;
  notes: string;
};

export type OfficeLayout = {
  scene: Scene;
  assetAnchors: {
    sourceCanvas: RenderSize;
    furniture: {
      deskStandard: FurnitureAsset;
      artifactHub: FurnitureAsset;
    };
    orbs: {
      gray: OrbAsset;
    };
    avatars: {
      recommendedRenderSize: RenderSize;
      byActor: Record<string, {
        atDesk: AvatarPoseAsset;
      }>;
    };
  };
  workspaces: WorkspaceDefinition[];
  desks: DeskDefinition[];
  artifactHub: {
    id: string;
    hubAnchor: ScenePoint;
  };
};

export const officeLayout = officeLayoutJson as OfficeLayout;

export const toPublicAssetPath = (assetPath: string) => `/${assetPath.replace(/^images\//, '')}`;

export const officeScenePath = toPublicAssetPath(officeLayout.scene.path);
