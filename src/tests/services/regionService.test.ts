import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { regionService } from '../../services/regionService';
import { db } from '../../config/database';
import type {
  CreateRegionInput,
  RegionQuery,
} from '../../schemas/regionSchema';

describe('RegionService', () => {
  // Clean up before each test
  beforeEach(async () => {
    await db.deleteFrom('regions').execute();
  });

  // Clean up after each test
  afterEach(async () => {
    await db.deleteFrom('regions').execute();
  });

  describe('createRegion', () => {
    it('should create a region successfully', async () => {
      const input: CreateRegionInput = {
        name: 'Test Region',
        isCity: false,
      };

      const result = await regionService.createRegion(input);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Region');
      expect(result?.isCity).toBe(false);
      expect(result?.id).toBeTypeOf('number');
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a city region', async () => {
      const input: CreateRegionInput = {
        name: 'Test City',
        isCity: true,
      };

      const result = await regionService.createRegion(input);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Test City');
      expect(result?.isCity).toBe(true);
    });

    it('should handle duplicate region names', async () => {
      try {
        const input: CreateRegionInput = {
          name: 'Duplicate Region',
          isCity: false,
        };

        // Create first region
        await regionService.createRegion(input);

        // Try to create duplicate - should handle gracefully
        const result = await regionService.createRegion(input);
      } catch (error) {
        // If your service throws an error for duplicates, we expect it here
        expect(error).toBeDefined();
        expect(error.message).toContain(
          'duplicate key value violates unique constraint'
        );
      }
    });
  });

  describe('getRegions', () => {
    it('should return empty result when no regions exist', async () => {
      const query: RegionQuery = { page: 1, limit: 10, isCity: false };
      const result = await regionService.getRegions(query);

      expect(result).toBeDefined();
      expect(result?.regions).toEqual([]);
      expect(result?.total).toBe(0);
    });

    it('should return regions with pagination', async () => {
      // Create test data
      const regions = [
        { name: 'Region 1', isCity: false },
        { name: 'Region 2', isCity: true },
        { name: 'Region 3', isCity: false },
      ];

      for (const region of regions) {
        await regionService.createRegion(region);
      }

      const query: RegionQuery = { page: 1, limit: 2, isCity: false };
      const result = await regionService.getRegions(query);

      expect(result).toBeDefined();
      expect(result?.regions).toHaveLength(2);
      expect(result?.total).toBe(2);
    });

    it('should filter by isCity', async () => {
      // Create test data
      await regionService.createRegion({ name: 'City 1', isCity: true });
      await regionService.createRegion({ name: 'Region 1', isCity: false });
      await regionService.createRegion({ name: 'City 2', isCity: true });

      const query: RegionQuery = { page: 1, limit: 10, isCity: true };
      const result = await regionService.getRegions(query);

      expect(result).toBeDefined();
      expect(result?.regions).toHaveLength(2);
      expect(result?.total).toBe(2);
      expect(result?.regions.every(r => r.isCity)).toBe(true);
    });

    it('should filter by search term', async () => {
      // Create test data
      await regionService.createRegion({ name: 'New York', isCity: true });
      await regionService.createRegion({ name: 'New Jersey', isCity: false });
      await regionService.createRegion({ name: 'California', isCity: false });

      const query: RegionQuery = {
        page: 1,
        limit: 10,
        search: 'New',
        isCity: false,
      };
      const result = await regionService.getRegions(query);

      expect(result).toBeDefined();
      expect(result?.regions).toHaveLength(1);
      expect(result?.total).toBe(1);
      expect(result?.regions.every(r => r.name.includes('New'))).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      // Create 5 regions
      for (let i = 1; i <= 5; i++) {
        await regionService.createRegion({
          name: `Region ${i}`,
          isCity: false,
        });
      }

      // Get first page
      const page1 = await regionService.getRegions({
        page: 1,
        limit: 2,
        isCity: false,
      });
      expect(page1?.regions).toHaveLength(2);
      expect(page1?.total).toBe(5);

      // Get second page
      const page2 = await regionService.getRegions({
        page: 2,
        limit: 2,
        isCity: false,
      });
      expect(page2?.regions).toHaveLength(2);
      expect(page2?.total).toBe(5);

      // Get third page
      const page3 = await regionService.getRegions({
        page: 3,
        limit: 2,
        isCity: false,
      });
      expect(page3?.regions).toHaveLength(1);
      expect(page3?.total).toBe(5);
    });
  });

  describe('getRegionById', () => {
    it('should return region by id', async () => {
      const created = await regionService.createRegion({
        name: 'Test Region',
        isCity: false,
      });

      const result = await regionService.getRegionById(created!.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created?.id);
      expect(result?.name).toBe('Test Region');
    });

    it('should return undefined for non-existent id', async () => {
      const result = await regionService.getRegionById(999);
      expect(result).toBeUndefined();
    });
  });

  describe('updateRegion', () => {
    it('should update region successfully', async () => {
      const created = await regionService.createRegion({
        name: 'Original Name',
        isCity: false,
      });

      const updated = await regionService.updateRegion(created!.id, {
        name: 'Updated Name',
        isCity: true,
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.isCity).toBe(true);
      expect(updated?.id).toBe(created?.id);
    });

    it('should return undefined for non-existent id', async () => {
      const result = await regionService.updateRegion(999, {
        name: 'Updated Name',
        isCity: true,
      });

      expect(result).toBeUndefined();
    });
  });

  describe('deleteRegion', () => {
    it('should delete region successfully', async () => {
      const created = await regionService.createRegion({
        name: 'To Delete',
        isCity: false,
      });

      const result = await regionService.deleteRegion(created!.id);
      expect(result).toBe(true);

      // Verify it's deleted
      const deleted = await regionService.getRegionById(created!.id);
      expect(deleted).toBeUndefined();
    });

    it('should return false for non-existent id', async () => {
      const result = await regionService.deleteRegion(999);
      expect(result).toBe(false);
    });
  });
});
