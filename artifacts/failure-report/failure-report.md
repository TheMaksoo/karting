# 🔴 CI Pipeline Failed

**Commit:** 24ae88d876c69fcdd7e0d04da0b4a4e5356edbaf
**Branch:** main
**Time:** Wed Jan 28 19:06:30 UTC 2026

## Error Details

Copy the content below and paste it to GitHub Copilot to get automatic fixes:

```
=== artifacts/frontend-test-results/test-output.txt ===

> karting-frontend@1.0.0 test:coverage
> vitest run --coverage


[31m⎯⎯⎯⎯⎯⎯⎯[1m[7m Startup Error [27m[22m⎯⎯⎯⎯⎯⎯⎯⎯[39m
Error: Cannot find module @rollup/rollup-linux-x64-gnu. npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). Please try `npm i` again after removing both package-lock.json and node_modules directory.
    at requireWithFriendlyError (/home/runner/work/karting/karting/portal/frontend/node_modules/rollup/dist/native.js:83:9)
    at Object.<anonymous> (/home/runner/work/karting/karting/portal/frontend/node_modules/rollup/dist/native.js:92:76)
    ... 3 lines matching cause stack trace ...
    at Module._load (node:internal/modules/cjs/loader:1091:12)
    at cjsLoader (node:internal/modules/esm/translators:298:15)
    at ModuleWrap.<anonymous> (node:internal/modules/esm/translators:240:7)
    at ModuleJob.run (node:internal/modules/esm/module_job:325:25)
    at async ModuleLoader.import (node:internal/modules/esm/loader:606:24) {
  [cause]: Error: Cannot find module '@rollup/rollup-linux-x64-gnu'
  Require stack:
  - /home/runner/work/karting/karting/portal/frontend/node_modules/rollup/dist/native.js
      at Module._resolveFilename (node:internal/modules/cjs/loader:1207:15)
      at Module._load (node:internal/modules/cjs/loader:1038:27)
      at Module.require (node:internal/modules/cjs/loader:1289:19)
      at require (node:internal/modules/helpers:182:18)
      at requireWithFriendlyError (/home/runner/work/karting/karting/portal/frontend/node_modules/rollup/dist/native.js:65:10)
      at Object.<anonymous> (/home/runner/work/karting/karting/portal/frontend/node_modules/rollup/dist/native.js:92:76)
      at Module._compile (node:internal/modules/cjs/loader:1521:14)
      at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
      at Module.load (node:internal/modules/cjs/loader:1266:32)
      at Module._load (node:internal/modules/cjs/loader:1091:12) {
    code: 'MODULE_NOT_FOUND',
    requireStack: [
      '/home/runner/work/karting/karting/portal/frontend/node_modules/rollup/dist/native.js'
    ]
  }
}




=== artifacts/python-test-results/test-output.txt ===
============================= test session starts ==============================
platform linux -- Python 3.11.14, pytest-9.0.2, pluggy-1.6.0 -- /opt/hostedtoolcache/Python/3.11.14/x64/bin/python
cachedir: .pytest_cache
rootdir: /home/runner/work/karting/karting/data-importer/scripts
configfile: pytest.ini
testpaths: tests
plugins: cov-7.0.0, mock-3.15.1
collecting ... collected 23 items / 1 error

==================================== ERRORS ====================================
____________________ ERROR collecting tests/test_config.py _____________________
ImportError while importing test module '/home/runner/work/karting/karting/data-importer/scripts/tests/test_config.py'.
Hint: make sure your test modules/packages have valid Python names.
Traceback:
/opt/hostedtoolcache/Python/3.11.14/x64/lib/python3.11/importlib/__init__.py:126: in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
tests/test_config.py:13: in <module>
    from config import load_secrets, get_heat_price, get_cost_per_lap
E   ImportError: cannot import name 'load_secrets' from 'config' (/home/runner/work/karting/karting/data-importer/scripts/config.py)
- generated xml file: /home/runner/work/karting/karting/data-importer/scripts/test-results.xml -
=========================== short test summary info ============================
ERROR tests/test_config.py
!!!!!!!!!!!!!!!!!!!! Interrupted: 1 error during collection !!!!!!!!!!!!!!!!!!!!
=============================== 1 error in 0.25s ===============================

=== artifacts/frontend-lint-results/typecheck-output.txt ===

> karting-frontend@1.0.0 type-check
> vue-tsc --build


=== artifacts/frontend-lint-results/lint-output.txt ===

> karting-frontend@1.0.0 lint
> eslint .


/home/runner/work/karting/karting/portal/frontend/src/App.vue
  6:9  warning  'applyStyles' is assigned a value but never used  @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/components/QuickStats.vue
  23:10  warning  'computed' is defined but never used        @typescript-eslint/no-unused-vars
  38:7   warning  'props' is assigned a value but never used  @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/components/TrackMap.vue
   16:8   warning  'axios' is defined but never used                    @typescript-eslint/no-unused-vars
   18:7   warning  'props' is assigned a value but never used           @typescript-eslint/no-unused-vars
   96:11  warning  'avgGapToRecord' is assigned a value but never used  @typescript-eslint/no-unused-vars
  100:11  warning  'lapsPerSession' is assigned a value but never used  @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/components/admin/SessionsTable.vue
  155:7  warning  'props' is assigned a value but never used  @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/components/charts/ChartWrapper.vue
  30:10  warning  'computed' is defined but never used        @typescript-eslint/no-unused-vars
  40:7   warning  'props' is assigned a value but never used  @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/composables/useChartConfig.ts
  28:35  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/home/runner/work/karting/karting/portal/frontend/src/composables/useKartingAPI.ts
  124:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  141:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  158:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  171:21  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  180:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  197:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  214:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  223:72  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  231:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  237:51  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  243:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  249:59  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  257:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  263:78  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  270:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/home/runner/work/karting/karting/portal/frontend/src/composables/useStyleVariables.ts
   47:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
   75:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  102:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  128:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/home/runner/work/karting/karting/portal/frontend/src/services/api.ts
  122:10  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  212:13  warning  Unexpected console statement. Only these console methods are allowed: warn, error  no-console
  279:79  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  280:81  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  354:30  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  385:26  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  420:47  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  421:56  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  425:43  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  450:23  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  459:23  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  469:34  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  549:13  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  618:38  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  641:34  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  641:48  warning  Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any

/home/runner/work/karting/karting/portal/frontend/src/stores/driver.ts
  17:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  31:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  45:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  60:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  81:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  98:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/home/runner/work/karting/karting/portal/frontend/src/stores/track.ts
  17:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  31:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  45:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  60:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  81:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  98:19  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/home/runner/work/karting/karting/portal/frontend/src/views/BattlesView.vue
  128:15  warning  'computed' is defined but never used  @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/views/EmlUploadView.vue
  1079:19  warning  'index' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  1177:7   warning  'viewUploadedLaps' is assigned a value but never used                    @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/views/FinancialView.vue
  164:15  warning  'computed' is defined but never used                                         @typescript-eslint/no-unused-vars
  217:18  warning  'driverStats' is assigned a value but never used                             @typescript-eslint/no-unused-vars
  509:45  warning  'sessionId' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/views/GeographicView.vue
  130:5  warning  'map' is assigned a value but never used      @typescript-eslint/no-unused-vars
  131:5  warning  'markers' is assigned a value but never used  @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/views/HomeView.vue
   522:59  warning  'watch' is defined but never used                                        @typescript-eslint/no-unused-vars
   530:30  warning  'OverviewStats' is defined but never used                                @typescript-eslint/no-unused-vars
   530:50  warning  'DriverStat' is defined but never used                                   @typescript-eslint/no-unused-vars
   530:67  warning  'TrackStat' is defined but never used                                    @typescript-eslint/no-unused-vars
   542:58  warning  'getAllLaps' is assigned a value but never used                          @typescript-eslint/no-unused-vars
   616:7   warning  'heatmapApiData' is assigned a value but never used                      @typescript-eslint/no-unused-vars
   619:7   warning  'consistencyChange' is assigned a value but never used                   @typescript-eslint/no-unused-vars
   645:7   warning  'deselectAllActivityDrivers' is assigned a value but never used          @typescript-eslint/no-unused-vars
   661:5   warning  'chartCreationCount' is assigned a value but never used                  @typescript-eslint/no-unused-vars
   676:7   warning  'getTrophyIcon' is assigned a value but never used                       @typescript-eslint/no-unused-vars
   809:26  warning  'driversData' is assigned a value but never used                         @typescript-eslint/no-unused-vars
   809:39  warning  'tracksData' is assigned a value but never used                          @typescript-eslint/no-unused-vars
  1015:7   warning  'getCellTooltip' is assigned a value but never used                      @typescript-eslint/no-unused-vars
  1172:34  warning  'index' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  1199:15  warning  'nonNullPoints' is assigned a value but never used                       @typescript-eslint/no-unused-vars
  1223:25  warning  'idx' is defined but never used. Allowed unused args must match /^_/u    @typescript-eslint/no-unused-vars
  1224:11  warning  'validPoints' is assigned a value but never used                         @typescript-eslint/no-unused-vars
  1356:50  warning  'ds' is defined but never used. Allowed unused args must match /^_/u     @typescript-eslint/no-unused-vars
  1356:59  warning  'idx' is defined but never used. Allowed unused args must match /^_/u    @typescript-eslint/no-unused-vars
  1461:12  warning  'error' is defined but never used                                        @typescript-eslint/no-unused-vars
  1471:12  warning  'error' is defined but never used                                        @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/views/PredictiveView.vue
  173:15  warning  'computed' is defined but never used           @typescript-eslint/no-unused-vars
  401:9   warning  'avgTime' is assigned a value but never used   @typescript-eslint/no-unused-vars
  402:9   warning  'bestTime' is assigned a value but never used  @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/views/TemporalView.vue
  124:15  warning  'computed' is defined but never used                                         @typescript-eslint/no-unused-vars
  385:38  warning  'sessionId' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/views/TrackPerformanceView.vue
  187:9  warning  'params' is assigned a value but never used  @typescript-eslint/no-unused-vars

/home/runner/work/karting/karting/portal/frontend/src/views/UserSettingsView.vue
  212:13  warning  'driverIds' is assigned a value but never used  @typescript-eslint/no-unused-vars
  281:12  warning  'error' is defined but never used               @typescript-eslint/no-unused-vars

✖ 95 problems (0 errors, 95 warnings)


```
