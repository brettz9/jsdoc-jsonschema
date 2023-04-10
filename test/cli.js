import {readFile as rf, unlink as ul} from 'fs';
import {fileURLToPath} from 'url';
import {promisify} from 'util';
import {join, dirname} from 'path';
import {execFile as ef} from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const readFile = promisify(rf);
const execFile = promisify(ef);
const unlink = promisify(ul);

const binFile = join(__dirname, '../bin/cli.js');

const getFixturePath = (path) => {
  return join(__dirname, `fixtures/${path}`);
};
const getResultsPath = (path) => {
  return join(__dirname, `results/${path}`);
};
const cliSample = getFixturePath('sample.json');
const cliSampleIntegerSpace = getFixturePath('sample-integer-space.json');
const cliSampleStringSpace = getFixturePath('sample-string-space.json');
const outputPath = getResultsPath('sample.json');
const defaultOutputPath = getFixturePath('sample.json');
const configPath = getFixturePath('config.js');

describe('Binary', function () {
  this.timeout(8000);
  it('should log help', async function () {
    const {stdout} = await execFile(binFile, ['-h']);
    expect(stdout).to.contain(
      'comment blocks'
    );
  });

  it('should err without `file` (or help/version) flag', async function () {
    const {stderr} = await execFile(binFile, []);
    expect(stderr).to.contain(
      'The `file` argument is required (or use `--help` or `--version`).'
    );
  });

  describe('Executing', function () {
    const unlinker = async () => {
      try {
        return await unlink(outputPath);
      } catch (err) {}
      return undefined;
    };
    before(unlinker);
    after(unlinker);

    it('should execute main CLI', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          'test/fixtures/sample.js',
          '--outputPath', outputPath
        ],
        {
          timeout: 15000
        }
      );
      if (stderr) {
        console.log('stderr', stderr);
      }
      expect(stdout).to.contain(
        `Finished writing files!`
      );
      expect(stderr).to.equal('');
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(cliSample, 'utf8');
      expect(contents).to.equal(expected);
    });

    it('should execute main CLI (no output path)', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          'test/fixtures/sample.js'
        ],
        {
          timeout: 15000
        }
      );
      if (stderr) {
        console.log('stderr', stderr);
      }
      expect(stdout).to.contain(
        `Finished writing files!`
      );
      expect(stderr).to.equal('');
      const contents = await readFile(defaultOutputPath, 'utf8');
      const expected = await readFile(cliSample, 'utf8');
      expect(contents).to.equal(expected);
    });

    it('should execute with integer `space`', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          'test/fixtures/sample.js',
          '--outputPath', outputPath,
          '--space', '4'
        ],
        {
          timeout: 15000
        }
      );
      if (stderr) {
        console.log('stderr', stderr);
      }
      expect(stdout).to.contain(
        `Finished writing files!`
      );
      expect(stderr).to.equal('');
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(cliSampleIntegerSpace, 'utf8');
      expect(contents).to.equal(expected);
    });

    it('should execute with string `space`', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          'test/fixtures/sample.js',
          '--outputPath', outputPath,
          '--space', '"\t"'
        ],
        {
          timeout: 15000
        }
      );
      if (stderr) {
        console.log('stderr', stderr);
      }
      expect(stdout).to.contain(
        `Finished writing files!`
      );
      expect(stderr).to.equal('');
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(cliSampleStringSpace, 'utf8');
      expect(contents).to.equal(expected);
    });

    it('should execute with `configPath`', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          '--configPath', configPath
        ],
        {
          timeout: 15000
        }
      );
      if (stderr) {
        console.log('stderr', stderr);
      }
      expect(stdout).to.contain(
        `Finished writing files!`
      );
      expect(stderr).to.equal('');
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(cliSampleStringSpace, 'utf8');
      expect(contents).to.equal(expected);
    });
  });
});
