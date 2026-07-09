export type TeamMemberStatistics = {
  hp: number;
  attack: number;
  defence: number;
  AP: number;
  dodge: number;
  accuracy: number;
};

export type TeamMember = {
  id: number;
  name: string;
  statistics: TeamMemberStatistics;
  tileID: number;
  rotationY: number;
  utilities: string[];
};
