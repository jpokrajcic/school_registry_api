import {
  type Generated,
  type Insertable,
  type Selectable,
  type Updateable,
} from 'kysely';

// Enums
export enum OwnershipType {
  Public = 'public',
  Private = 'private',
}

// Interfaces
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

export interface UserTable {
  id: Generated<number>;
  email: string;
  password_hash: string;
  role_id: number;
  school_id: number | null; // nullable for ministry or regional users
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type SafeUserNonTable = {
  id: Generated<number>;
  email: string;
  role_id: number;
  school_id: number | null;
  created_at: Date;
  updated_at: Date;
};

export interface RoleTable {
  id: Generated<number>;
  name: string;
  description: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface Database {
  regions: RegionTable;
  schools: SchoolTable;
  migrations: MigrationTable;
  users: UserTable;
  roles: RoleTable;
}

export type Region = Selectable<RegionTable>;
export type NewRegion = Insertable<RegionTable>;
export type RegionUpdate = Updateable<RegionTable>;

export type School = Selectable<SchoolTable>;
export type NewSchool = Insertable<SchoolTable>;
export type SchoolUpdate = Updateable<SchoolTable>;

export type Migration = Selectable<MigrationTable>;
export type newMigration = Insertable<MigrationTable>;

export type User = Selectable<UserTable>;
export type SafeUser = Selectable<SafeUserNonTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export type Role = Selectable<RoleTable>;
export type NewRole = Insertable<RoleTable>;
export type RoleUpdate = Updateable<RoleTable>;
