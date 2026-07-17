import officeLayoutJson from '../../../../docs/office-layout.json';

export type ScenePoint = {
  x: number;
  y: number;
};

export type RenderSize = {
  width: number;
  height: number;
};

export type SourceRect = ScenePoint & RenderSize;

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
  sourceAlphaBounds?: SourceRect;
  screenRectSource?: SourceRect;
};

export type OrbAsset = AnchoredAsset & {
  meaning: string;
  visualCenterSource: ScenePoint;
};

export type AvatarPoseAsset = {
  path: string;
  visualFootShadowCenterSource: ScenePoint;
};

export type AtDeskAvatarPoseAsset = AvatarPoseAsset & {
  visualSeatCenterSource: ScenePoint;
};

export type AvatarPoseName = 'idle' | 'atDesk' | 'walk' | 'carry';

export type AvatarActorAssets = {
  idle: AvatarPoseAsset;
  atDesk: AtDeskAvatarPoseAsset;
  walk: AvatarPoseAsset;
  carry: AvatarPoseAsset;
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
  seatAnchor: ScenePoint;
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

export type HandoffRoute = {
  deskId: string;
  deskExit: ScenePoint;
  staging: ScenePoint;
  hubApproach: ScenePoint;
  deskReturn: ScenePoint;
};

export type HandoffAnchors = {
  policy: string;
  producerRoute: HandoffRoute;
  consumerRoute: HandoffRoute;
  devProducerRoute: HandoffRoute;
  qaConsumerRoute: HandoffRoute;
  hubDropPoint: ScenePoint;
  hubPickupPoint: ScenePoint;
  artifactAnchors: {
    aliceDesk: ScenePoint;
    jackDesk: ScenePoint;
    quinnDesk: ScenePoint;
  };
  carriedArtifactOffsets: {
    alice: ScenePoint;
    jack: ScenePoint;
    quinn: ScenePoint;
  };
  statusAnchors: {
    jackReceiptBubble: ScenePoint;
    jackCodingLabel: ScenePoint;
    quinnReceiptBubble: ScenePoint;
    quinnTestingLabel: ScenePoint;
  };
};

export type OfficeLayout = {
  scene: Scene;
  assetAnchors: {
    sourceCanvas: RenderSize;
    furniture: {
      deskStandard: FurnitureAsset;
      deskChairBack: FurnitureAsset;
      deskFront: FurnitureAsset;
      artifactHub: FurnitureAsset;
    };
    artifacts: {
    prdBlue: FurnitureAsset;
      featureGreen: FurnitureAsset;
      reportPurple: FurnitureAsset;
    };
    orbs: Record<'blue' | 'gray' | 'yellow', OrbAsset>;
    avatars: {
      recommendedRenderSize: RenderSize;
      byActor: Record<string, AvatarActorAssets>;
    };
  };
  workspaces: WorkspaceDefinition[];
  desks: DeskDefinition[];
  artifactHub: {
    id: string;
    hubAnchor: ScenePoint;
    artifactSlots: Array<{
      id: string;
      assetKey: 'artifact.prdBlue' | 'artifact.featureGreen' | 'artifact.reportPurple';
      anchor: ScenePoint;
    }>;
  };
  handoffAnchors: HandoffAnchors;
};

export const officeLayout = officeLayoutJson as OfficeLayout;

export const toPublicAssetPath = (assetPath: string) => `/${assetPath.replace(/^images\//, '')}`;

export const officeScenePath = toPublicAssetPath(officeLayout.scene.path);
