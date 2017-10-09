/* eslint no-console:0 */
import babel from 'gulp-babel';
import babelRegister from 'babel-core/register';
import bump from 'gulp-bump';
import del from 'del';
import eslint from 'gulp-eslint';
import fs from 'fs';
import git from 'git-rev';
import gulp from 'gulp';
import gulpIf from 'gulp-if';
import gutil from 'gulp-util';
import istanbul from 'gulp-babel-istanbul';
import mocha from 'gulp-mocha';
import nodemon from 'gulp-nodemon';
import path from 'path';
import yargs from 'yargs';

const config = {
  name: '',
  packageJson: './package.json',
  sourceFiles: 'src/**/*.js',
  copyFiles: ['src/**/*.*', '!src/**/*.js'],
  unitTestFiles: 'test/unit/**/*.js',
  coverage: {
    // start with istanbul defaults (see https://www.npmjs.com/package/gulp-babel-istanbul):
    includeUntested: false, // set to true if you want coverage for all source files
    enforceThresholds: {
      thresholds: {
        global: false // set a number between 1 and 100 to enable (false to disable)
      }
    }
  },
  outputFolder: 'lib/',
  watchFiles: 'src/**/*.*',
  cleanFiles: undefined,
  main: 'index.js',
  help: `
    Dev Tasks:
      - "npm start" or "gulp" or "gulp dev": run app in development mode (with watch)
      - "gulp lint": run static code analysis (this is run with 'build' and 'dev')
      - "gulp lint --fix": run fixing of some code issues
      - "npm test" or "gulp mocha": run mocha unit tests
      - "gulp {taskName} --help": prints options (if any) for the task (try "gulp mocha -h")

    Production Tasks:
      - "gulp build": build app for production
      - "gulp clean": remove built artifacts
      - "node": start app, remember to run "gulp build" first and set NODE_ENV
  `
};

const packageFile = JSON.parse(fs.readFileSync(config.packageJson, 'utf8'));

const isBuildServer = !!(process.env.CIRCLECI || process.env.STACKATO);
if (isBuildServer) {
  console.log('Running on a build server, errors will break the build');
}

const args = yargs
  .alias('p', 'production')
  .argv;

// Check if we should run production, otherwise use the current NODE_ENV or set to 'development'
process.env.NODE_ENV = args.production ? 'production' : (process.env.NODE_ENV || 'development');

gulp.task('lint', () => {
  const opts = yargs
    .option('fix', {
      default: false,
      describe: 'fix lint issues',
      type: 'boolean'
    })
    .help('h')
    .alias('h', 'help')
    .argv;
  const isFixed = (file) => opts.fix && file.eslint && file.eslint.fixed;

  return gulp.src([config.sourceFiles], { base: './' })
    .pipe(eslint({ fix: opts.fix }))
    .pipe(eslint.format())
    .pipe(gulpIf(isFixed, gulp.dest('./')))
    // Cause errors to break the pipeline only if running from build server
    .pipe(isBuildServer ? eslint.failAfterError() : gutil.noop());
});

gulp.task('transpile', () => {
  return gulp.src(config.sourceFiles)
    .pipe(babel())
    .pipe(gulp.dest(config.outputFolder));
});

gulp.task('copy-source', () => {
  return gulp.src(config.copyFiles)
    .pipe(gulp.dest(config.outputFolder));
});

gulp.task('watch', ['lint', 'transpile', 'copy-source'], () => {
  if (config.main && fs.lstatSync(config.main).isFile()) {
    nodemon({
      watch: [config.watchFiles],
      script: config.main,
      tasks: ['lint', 'transpile', 'copy-source']
    })
    .on('restart', () => {
      console.log('restarted!');
    });
  } else {
    const watcher = gulp.watch(config.watchFiles, ['lint', 'transpile', 'copy-source']);

    const logChange = (event) => {
      const file = path.relative(process.cwd(), event.path);
      if (event.type === 'deleted') {
        console.log('Removed \'' + file + '\'.');
      }
      console.log('File \'' + file + '\' was ' + event.type + ', running tasks.');
    };

    watcher.on('change', logChange);
  }
});

function convertReporterOptions(reporterOptions) {
  if (reporterOptions) {
    return reporterOptions.split(',').reduce((result, kvp) => {
      const option = kvp.split('=');
      return { ...result, [option[0]]: option[1] };
    }, {});
  }
  return {};
}

gulp.task('mocha', () => {
  // Keep these inside the task so that apps can overwrite the base config object
  const opts = yargs
    .option('c', {
      alias: 'cover',
      default: true,
      describe: 'generate coverage report',
      type: 'boolean'
    })
    .option('t', {
      alias: 'testFiles',
      default: config.unitTestFiles,
      describe: 'test files glob (you can use multiple -t options)',
      type: 'array'
    })
    .option('s', {
      alias: 'shutdown',
      default: true,
      describe: 'force shutdown of tests (see https://github.com/sindresorhus/gulp-mocha)',
      type: 'boolean'
    })
    .option('r', {
      alias: 'reporter',
      default: 'spec',
      describe: 'pass custom mocha reporter',
      type: 'string'
    })
    .option('ro', {
      alias: 'reporterOptions',
      default: null,
      describe: 'pass custom reporter options as comma separated key value pairs (e.g. key1=value1,key2=value2,key3=value3)',
      type: 'string'
    })
    .help('h')
    .alias('h', 'help')
    .argv;
  return gulp.src(config.sourceFiles)
    .pipe(gulpIf(opts.cover, istanbul(config.coverage)))
    .pipe(gulpIf(opts.cover, istanbul.hookRequire()))
    .on('finish', () => {
      return gulp.src(opts.testFiles)
        .pipe(mocha({
          compilers: {
            js: babelRegister
          },
          reporter: isBuildServer ? 'mocha-junit-reporter' : opts.reporter,
          reporterOptions: convertReporterOptions(opts.reporterOptions)
        }))
        .once('end', () => {
          // gulp mocha does not shut down properly after some tests
          // so force exit (see https://github.com/sindresorhus/gulp-mocha)
          if (opts.shutdown) {
            /* eslint no-process-exit: 0 */
            setTimeout(process.exit, 1);
          }
        })
        .pipe(gulpIf(opts.cover, istanbul.writeReports()))
        .pipe(gulpIf(opts.cover, istanbul.enforceThresholds(config.coverage.enforceThresholds)));
    });
});

gulp.task('clean', () => {
  // This runs synchronously and will block other tasks
  del.sync(
    (config.cleanFiles || [path.join(config.outputFolder, '**')])
  );
});

gulp.task('check-snapshots', () => {
  git.branch((branch) => {
    if (branch.toLowerCase() === 'master') {
      // Do not allow snapshots in master
      const deps = JSON.stringify((packageFile || {}).dependencies);
      if (deps.includes('SNAPSHOT')) {
        throw new Error('You cannot have SNAPSHOT builds in the "master" branch!');
      }
    }
  });
});

// Bump the version number in the package.json for publishing
gulp.task('bump', () => {
  if (process.env.CIRCLECI) {
    git.branch((branch) => {
      const versionParts = packageFile.version.split('.');
      const buildNumber = process.env.CIRCLE_BUILD_NUM || 0;

      // If this is not master branch, then make it a snapshot
      const newVersion = `${versionParts[0]}.${versionParts[1]}${
        (branch.toLowerCase() === 'master')
          ? `.${buildNumber}`
          : `.0-${branch.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-SNAPSHOT`
        }`;

      console.log(`New version: ${newVersion}`);
      gulp.src([config.packageJson])
        .pipe(bump({version: newVersion}))
        .pipe(gulp.dest('./'));
    });
  }
});

gulp.task('build-info', () => {
  // Generate the build-info.json file used for health checks
  if (process.env.CIRCLECI) {
    git.branch((branch) => {
      git.long((commit) => {
        fs.writeFileSync('build-info.json', JSON.stringify({
          buildTimestamp: new Date().toISOString(),
          gitBranch: branch,
          gitCommit: commit,
          repository: (process.env.CIRCLE_PROJECT_REPONAME || config.name || packageFile.name).toUpperCase(),
          build: process.env.CIRCLE_BUILD_NUM || -1,
          instigator: process.env.CIRCLE_USERNAME || ''
        }, null, '  '));
      });
    });
  } else {
    fs.writeFileSync('build-info.json', JSON.stringify({
      buildTimestamp: new Date().toISOString(),
      gitBranch: process.env.GIT_BRANCH,
      gitCommit: process.env.GIT_COMMIT,
      repository: (process.env.GIT_REPO || config.name || packageFile.name).toUpperCase(),
      build: process.env.GIT_COMMIT || -1,
      instigator: process.env.USERNAME || process.env.username || ''
    }, null, '  '));
  }
});

// COMMANDS
gulp.task('help', () => {
  console.log(config.help);
});

// for server builds
gulp.task('build',
  ['check-snapshots', 'clean', 'lint', 'transpile', 'copy-source', 'build-info', 'bump']);

// for development builds
gulp.task('dev',
  ['build-info', 'watch']);

// default task calls dev
gulp.task('default',
  ['dev']);

module.exports.config = config;
module.exports.tasks = gulp.tasks;