import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  splitFilename,
  buildRenamedFilename,
  batchRenameFiles,
  generateShellScript,
  generateMappingCsv,
  createRenamedZip,
} from "./engine";
import JSZip from "jszip";

describe("Bulk Filename Builder Engine", () => {
  describe("splitFilename", () => {
    it("should split extension and base correctly", () => {
      assert.deepEqual(splitFilename("vacation_photo.jpg"), { base: "vacation_photo", ext: ".jpg" });
      assert.deepEqual(splitFilename("archive.tar.gz"), { base: "archive.tar", ext: ".gz" });
      assert.deepEqual(splitFilename("README"), { base: "README", ext: "" });
    });
  });

  describe("buildRenamedFilename", () => {
    it("should add prefix and suffix", () => {
      const res = buildRenamedFilename("banner.png", 0, {
        prefix: "v2_",
        suffix: "_final",
      });
      assert.equal(res, "v2_banner_final.png");
    });

    it("should slugify and lowercase messy names", () => {
      const res = buildRenamedFilename("Summer Beach Party (2026)!.jpeg", 0, {
        slugify: true,
        casing: "lowercase",
      });
      assert.equal(res, "summer-beach-party-2026.jpeg");
    });

    it("should append zero-padded numbers", () => {
      const res0 = buildRenamedFilename("photo.jpg", 0, {
        numbering: true,
        numberingStart: 1,
        numberingDigits: 3,
        numberingPosition: "suffix",
      });
      assert.equal(res0, "photo_001.jpg");

      const res9 = buildRenamedFilename("photo.jpg", 9, {
        numbering: true,
        numberingStart: 1,
        numberingDigits: 3,
        numberingPosition: "suffix",
      });
      assert.equal(res9, "photo_010.jpg");
    });

    it("should change extension when requested", () => {
      const res = buildRenamedFilename("graphic.png", 0, {
        changeExtension: "webp",
      });
      assert.equal(res, "graphic.webp");
    });
  });

  describe("batchRenameFiles & exporters", () => {
    it("should batch rename and generate bash script", () => {
      const files = ["IMG_001.JPG", "IMG_002.JPG"];
      const mappings = batchRenameFiles(files, {
        prefix: "trip_",
        casing: "lowercase",
      });

      assert.equal(mappings[0].newName, "trip_img_001.jpg");
      assert.equal(mappings[0].hasChanged, true);

      const sh = generateShellScript(mappings, "sh");
      assert.ok(sh.includes("mv -n -- 'IMG_001.JPG' 'trip_img_001.jpg'"));
    });

    it("should safely escape shell injection attempts in filenames", () => {
      const malicious = [
        { oldName: 'file$(whoami).txt', newName: 'safe_name.txt', hasChanged: true },
        { oldName: "file' && rm -rf / '.txt", newName: "clean.txt", hasChanged: true },
      ];
      const sh = generateShellScript(malicious, "sh");
      // Check that quotes and command substitutions are escaped
      assert.ok(sh.includes("mv -n -- 'file$(whoami).txt' 'safe_name.txt'"));
      assert.ok(sh.includes("'\\''")); // single quote escaped as '\'
    });

    it("should resolve duplicate target filenames to prevent ZIP overwrite", () => {
      // Both files with static find/replace would become photo.jpg without deduplication
      const duplicateTargets = ["image1.jpg", "image2.jpg", "image3.jpg"];
      const mappings = batchRenameFiles(duplicateTargets, {
        findText: "image",
        replaceText: "photo",
        slugify: false,
      });

      assert.equal(mappings[0].newName, "photo1.jpg");
      // If rule produces identical names:
      const identicalInput = ["fileA.png", "fileB.png"];
      const collMappings = batchRenameFiles(identicalInput, {
        prefix: "document",
        suffix: "",
        findText: "fileA",
        replaceText: "",
      });
      // fileA -> document.png
      // If user replaces fileB with empty string -> document.png as well
      const testDedupe = batchRenameFiles(["a.txt", "b.txt"], {
        findText: "b",
        replaceText: "a", // both become a.txt
      });
      assert.equal(testDedupe[0].newName, "a.txt");
      assert.equal(testDedupe[1].newName, "a (1).txt");
    });

    it("should generate CSV mapping table", () => {
      const mappings = [
        { oldName: "old.png", newName: "new.png", hasChanged: true },
      ];
      const csv = generateMappingCsv(mappings);
      assert.ok(csv.includes("old.png,new.png,true"));
    });

    it("should generate valid ZIP binary archive with PK magic bytes", async () => {
      const files = [
        { name: "photo_001.jpg", content: "JPEG_IMAGE_DATA_1" },
        { name: "photo_002.jpg", content: "JPEG_IMAGE_DATA_2" },
      ];
      const zipBytes = await createRenamedZip(files);
      assert.ok(zipBytes.length > 0, "Zip output should not be empty");

      // Verify standard ZIP magic bytes: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
      assert.equal(zipBytes[0], 0x50, "Magic byte 0 should be 'P'");
      assert.equal(zipBytes[1], 0x4b, "Magic byte 1 should be 'K'");
      assert.equal(zipBytes[2], 0x03, "Magic byte 2 should be 0x03");
      assert.equal(zipBytes[3], 0x04, "Magic byte 3 should be 0x04");

      // Verify unpack round-trip with JSZip
      const loaded = await JSZip.loadAsync(zipBytes);
      const file1 = loaded.file("photo_001.jpg");
      assert.ok(file1 !== null, "File 1 should exist in archive");
      const content1 = await file1.async("string");
      assert.equal(content1, "JPEG_IMAGE_DATA_1");

      const file2 = loaded.file("photo_002.jpg");
      assert.ok(file2 !== null, "File 2 should exist in archive");
      const content2 = await file2.async("string");
      assert.equal(content2, "JPEG_IMAGE_DATA_2");
    });
  });
});
