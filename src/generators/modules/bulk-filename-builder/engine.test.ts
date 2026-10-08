import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  splitFilename,
  buildRenamedFilename,
  batchRenameFiles,
  generateShellScript,
  generateMappingCsv,
} from "./engine";

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

    it("should generate CSV mapping table", () => {
      const mappings = [
        { oldName: "old.png", newName: "new.png", hasChanged: true },
      ];
      const csv = generateMappingCsv(mappings);
      assert.ok(csv.includes("old.png,new.png,true"));
    });
  });
});
