import {
  type Generated,
  type Insertable,
  type Selectable,
  type Updateable,
} from 'kysely';

export enum OwnershipType {
  Public = 'public',
  Private = 'private',
}

export interface RegionTable {
  id: Generated<number>;
  name: string;
  is_city: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface SchoolTable {
  id: Generated<number>;
  name: string;
  address: string;
  region_id: number;
  email: string;
  phone: string;
  ownership_type: OwnershipType;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface MigrationTable {
  id: Generated<number>;
  name: string;
  executed_at: Generated<Date>;
}

export interface Database {
  regions: RegionTable;
  schools: SchoolTable;
  migrations: MigrationTable;
}

export type Region = Selectable<RegionTable>;
export type NewRegion = Insertable<RegionTable>;
export type RegionUpdate = Updateable<RegionTable>;

export type School = Selectable<SchoolTable>;
export type NewSchool = Insertable<SchoolTable>;
export type SchoolUpdate = Updateable<SchoolTable>;

export type Migration = Selectable<MigrationTable>;
export type newMigration = Insertable<MigrationTable>;
