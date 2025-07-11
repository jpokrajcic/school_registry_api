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

export enum Gender {
  Male = 'male',
  Female = 'female',
}

export enum EmploymentType {
  FullTime = 'full-time',
  PartTime = 'part-time',
  Contract = 'contract',
}

// Interfaces
export interface RegionTable {
  id: Generated<number>;
  name: string;
  isCity: Generated<boolean>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface SchoolTable {
  id: Generated<number>;
  name: string;
  address: string;
  regionId: number;
  email: string;
  phone: string;
  ownershipType: OwnershipType;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface MigrationTable {
  id: Generated<number>;
  name: string;
  executedAt: Generated<Date>;
}

export interface UserTable {
  id: Generated<number>;
  email: string;
  passwordHash: string;
  roleId: number;
  schoolId: number | null; // nullable for ministry or regional users
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export type SafeUserNonTable = {
  id: Generated<number>;
  email: string;
  roleId: number;
  schoolId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface RoleTable {
  id: Generated<number>;
  name: string;
  description: string;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface StudentTable {
  id: Generated<number>;
  firstName: string;
  middleName: string;
  lastName: string;
  regionId: number | null;
  postCode: string;
  address: string;
  phone: string | null;
  email: string | null;
  mobile: string | null;
  gender: Gender;
  dateOfBirth: Date | null;
  studentNumber: string;
  schoolId: number | null;
  enrollmentDate: Date | null;
  active: boolean;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface TeacherTable {
  id: Generated<number>;
  firstName: string;
  middleName: string;
  lastName: string;
  postCode: string;
  address: string;
  email: string;
  phone: string | null;
  mobile: string | null;
  gender: Gender;
  dateOfBirth: Date | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface TeacherSchoolTable {
  id: Generated<number>;
  teacherId: number;
  schoolId: number;
  employmentType: EmploymentType;
  startDate: Date;
  endDate: Date | null;
  isActive: Generated<boolean>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface SubjectTable {
  id: Generated<number>;
  name: string;
  code: string;
  description: string;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}
export interface Database {
  regions: RegionTable;
  schools: SchoolTable;
  migrations: MigrationTable;
  users: UserTable;
  roles: RoleTable;
  students: StudentTable;
  teachers: TeacherTable;
  teacherSchools: TeacherSchoolTable;
  subjects: SubjectTable;
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

export type Student = Selectable<StudentTable>;
export type NewStudent = Insertable<StudentTable>;
export type StudentUpdate = Updateable<StudentTable>;

export type Teacher = Selectable<TeacherTable>;
export type NewTeacher = Insertable<TeacherTable>;
export type TeacherUpdate = Updateable<TeacherTable>;

export type TeacherSchool = Selectable<TeacherSchoolTable>;
export type NewTeacherSchool = Insertable<TeacherSchoolTable>;
export type TeacherSchoolUpdate = Updateable<TeacherSchoolTable>;

export type Subject = Selectable<SubjectTable>;
export type NewSubject = Insertable<SubjectTable>;
export type SubjectUpdate = Updateable<SubjectTable>;
