export type TeamMemberTileStatistics = {
  grassBP: number;
  sandBP: number;
  stoneBP: number;
  dirtBP?: number;
  forestBP?: number;
  desertBP?: number;
  rocksBP?: number;
};

export type TeamMemberStatistics = {
  hp: number;
  attack: number;
  defence: number;
  AP: number;
  dodge: number;
  accuracy: number;
  tileBP: TeamMemberTileStatistics
};

export type TeamMember = {
  id: number;
  name: string;
  objectName: string;
  statistics: TeamMemberStatistics;
  tileID: number;
  rotationY: number;
  abilities: string[];
};
