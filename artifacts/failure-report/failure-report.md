# 🔴 CI Pipeline Failed

**Commit:** 27d44151714ea95ceb757275a13a78fb3538ce41
**Branch:** main
**Time:** Wed Jan 28 20:43:49 UTC 2026

## Error Details

Copy the content below and paste it to GitHub Copilot to get automatic fixes:

```
=== artifacts/backend-test-results/test-output.txt ===

   PASS  Tests\Unit\EmlParserTest
  ✓ parser can be instantiated                                           0.30s  
  ✓ parse throws exception for nonexistent file                          0.03s  
  ✓ parse pdf throws exception for nonexistent file                      0.03s  
  ✓ parse text file returns array                                        0.03s  
  ✓ parse eml with minimal content                                       0.03s  
  ✓ extract lap times from html                                          0.03s  
  ✓ parse handles empty content gracefully                               0.03s  

   PASS  Tests\Unit\ExampleTest
  ✓ basic math                                                           0.10s  
  ✓ string operations

   PASS  Tests\Unit\ModelRelationshipTest
  ✓ track has many sessions                                              1.41s  
  ✓ session belongs to track                                             0.04s  
  ✓ session has many laps                                                0.07s  
  ✓ lap belongs to session                                               0.05s  
  ✓ lap belongs to driver                                                0.05s  
  ✓ driver has many laps                                                 0.06s  
  ✓ driver display name returns nickname if set                          0.23s  
  ✓ driver display name returns name if no nickname                      0.04s  
  ✓ user is admin check                                                  0.05s  
  ✓ track casts features to array                                        0.04s  
  ✓ track casts indoor to boolean                                        0.04s  

   PASS  Tests\Feature\AdminMiddlewareTest
  ✓ admin can access admin routes                                        0.13s  
  ✓ non admin cannot access admin routes                                 0.04s  
  ✓ unauthenticated user cannot access admin routes                      0.04s  
  ✓ admin can access upload routes                                       0.10s  
  ✓ driver cannot access upload routes                                   0.04s  

   PASS  Tests\Feature\AuthTest
  ✓ user can login with valid credentials                                0.07s  
  ✓ user cannot login with invalid credentials                           0.05s  
  ✓ login requires email and password                                    0.04s  
  ✓ authenticated user can get profile                                   0.04s  
  ✓ unauthenticated user cannot get profile                              0.03s  
  ✓ user can logout                                                      0.04s  
  ✓ user can change password                                             0.05s  
  ✓ change password requires correct current password                    0.05s  
  ✓ change password clears must change password flag                     0.05s  

   PASS  Tests\Feature\DriverControllerTest
  ✓ index returns all drivers                                            0.27s  
  ✓ index includes lap count                                             0.07s  
  ✓ store creates driver                                                 0.05s  
  ✓ store validates required name                                        0.04s  
  ✓ store validates unique email                                         0.05s  
  ✓ show returns driver with laps                                        0.06s  
  ✓ show returns 404 for nonexistent driver                              0.04s  
  ✓ update modifies driver                                               0.05s  
  ✓ update allows same email                                             0.05s  
  ✓ destroy deletes driver                                               0.05s  
  ✓ stats returns driver statistics                                      0.06s  
  ✓ stats can filter by driver id                                        0.05s  
  ✓ unauthenticated user cannot access drivers                           0.04s  

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response                        0.06s  

   FAIL  Tests\Feature\FriendControllerTest
  ✓ index returns user friends                                           0.10s  
  ✓ store adds friend                                                    0.06s  
  ✓ store prevents duplicate friends                                     0.05s  
  ⨯ destroy removes friend                                               0.05s  
  ✓ get friend driver ids returns ids                                    0.05s  
  ✓ user cannot see other users friends                                  0.05s  

   PASS  Tests\Feature\HealthCheckTest
  ✓ Health Check Endpoints → basic health check returns healthy status   0.07s  
  ✓ Health Check Endpoints → detailed health check includes all compone… 0.04s  
  ✓ Health Check Endpoints → readiness check verifies database connecti… 0.04s  
  ✓ Health Check Endpoints → liveness check always returns alive         0.03s  
  ✓ Health Check Component Verification → database check returns respon… 0.04s  
  ✓ Health Check Component Verification → cache check can read and writ… 0.04s  
  ✓ Health Check Component Verification → storage check can write files  0.04s  
  ✓ Health Check Metrics → metrics include memory usage                  0.04s  
  ✓ Health Check Metrics → metrics include version information           0.04s  

   PASS  Tests\Feature\KartingSessionControllerTest
  ✓ index returns sessions                                               0.10s  
  ✓ index can filter by track                                            0.06s  
  ✓ index can filter by date range                                       0.06s  
  ✓ store creates session                                                0.05s  
  ✓ store validates track exists                                         0.05s  
  ✓ show returns session with laps                                       0.07s  
  ✓ update modifies session                                              0.06s  
  ✓ destroy deletes session and laps                                     0.06s  
  ✓ laps returns session laps                                            0.08s  

   PASS  Tests\Feature\LapControllerTest
  ✓ index returns laps                                                   0.16s  
  ✓ index can filter by session                                          0.08s  
  ✓ store creates lap                                                    0.06s  
  ✓ store validates required fields                                      0.05s  
  ✓ show returns lap                                                     0.06s  
  ✓ update modifies lap                                                  0.06s  
  ✓ destroy deletes lap                                                  0.06s  
  ✓ by driver returns driver laps                                        0.08s  
  ✓ overview returns aggregated stats                                    0.08s  
  ✓ lap stores sector times                                              0.06s  

   PASS  Tests\Feature\TrackControllerTest
  ✓ index returns all tracks                                             0.10s  
  ✓ store creates track                                                  0.05s  
  ✓ store validates required fields                                      0.04s  
  ✓ show returns track                                                   0.05s  
  ✓ show returns 404 for nonexistent track                               0.04s  
  ✓ update modifies track                                                0.05s  
  ✓ destroy deletes track                                                0.05s  
  ✓ stats returns track statistics                                       0.06s  
  ✓ track stores json features                                           0.05s  
  ✓ track can have coordinates                                           0.05s  

   PASS  Tests\Feature\UploadControllerTest
  ✓ admin can access upload preview                                      0.06s  
  ✓ non admin cannot access upload                                       0.05s  
  ✓ unauthenticated user cannot upload                                   0.05s  
  ✓ manual entry validates required fields                               0.05s  
  ✓ manual entry creates session                                         0.05s  
  ✓ batch upload validates files                                         0.05s  
  ✓ preview parses eml content                                           0.06s  
  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\FriendControllerTest > destroy removes friend          
  Expected response status code [200] but received 404.
Failed asserting that 404 is identical to 200.

  at tests/Feature/FriendControllerTest.php:79
     75▕         ]);
     76▕ 
     77▕         $response = $this->actingAs($this->user)->deleteJson("/api/friends/{$friend->id}");
     78▕ 
  ➜  79▕         $response->assertStatus(200);
     80▕         $this->assertSoftDeleted('friends', ['id' => $friendship->id]);
     81▕     }
     82▕ 
     83▕     public function test_get_friend_driver_ids_returns_ids(): void


  Tests:    1 failed, 98 passed (197 assertions)
  Duration: 7.61s


=== artifacts/frontend-test-results/test-output.txt ===

> karting-frontend@1.0.0 test:coverage
> vitest run --coverage


[1m[7m[36m RUN [39m[27m[22m [36mv2.1.9 [39m[90m/home/runner/work/karting/karting/portal/frontend[39m
      [2mCoverage enabled with [22m[33mv8[39m

 [32m✓[39m src/stores/__tests__/track.spec.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 20[2mms[22m[39m
 [32m✓[39m src/stores/__tests__/driver.spec.ts [2m([22m[2m14 tests[22m[2m)[22m[90m 32[2mms[22m[39m
 [32m✓[39m src/stores/__tests__/auth.spec.ts [2m([22m[2m16 tests[22m[2m)[22m[90m 19[2mms[22m[39m
 [32m✓[39m src/services/__tests__/api.spec.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m

[2m Test Files [22m [1m[32m4 passed[39m[22m[90m (4)[39m
[2m      Tests [22m [1m[32m48 passed[39m[22m[90m (48)[39m
[2m   Start at [22m 20:42:20
[2m   Duration [22m 3.36s[2m (transform 262ms, setup 999ms, collect 348ms, tests 76ms, environment 1.41s, prepare 372ms)[22m

[34m % [39m[2mCoverage report from [22m[33mv8[39m
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |    7.77 |    63.68 |   14.03 |    7.77 |                   
 src               |       0 |        0 |       0 |       0 |                   
  App.vue          |       0 |        0 |       0 |       0 | 1-10              
 src/components    |       0 |        0 |       0 |       0 |                   
  ...Component.vue |       0 |        0 |       0 |       0 | 1-17              
  QuickStats.vue   |       0 |        0 |       0 |       0 | 1-38              
  ...Container.vue |       0 |        0 |       0 |       0 | 1-39              
  TrackMap.vue     |       0 |        0 |       0 |       0 | 1-182             
 ...mponents/admin |       0 |        0 |       0 |       0 |                   
  LapsTable.vue    |       0 |        0 |       0 |       0 | 1-212             
  ...ionsTable.vue |       0 |        0 |       0 |       0 | 1-249             
 ...ponents/charts |       0 |        0 |       0 |       0 |                   
  ChartWrapper.vue |       0 |        0 |       0 |       0 | 1-40              
  StatCard.vue     |       0 |        0 |       0 |       0 | 1-70              
 ...onents/filters |       0 |        0 |       0 |       0 |                   
  ChartFilters.vue |       0 |        0 |       0 |       0 | 1-123             
 ...omponents/home |       0 |        0 |       0 |       0 |                   
  ...dsSection.vue |       0 |        0 |       0 |       0 | 1-115             
  ...tActivity.vue |       0 |        0 |       0 |       0 | 1-82              
  QuickStats.vue   |       0 |        0 |       0 |       0 | 1-18              
 ...mponents/icons |       0 |        0 |       0 |       0 |                   
  ...Community.vue |       0 |        0 |       0 |       0 | 1-6               
  ...mentation.vue |       0 |        0 |       0 |       0 | 1-6               
  ...Ecosystem.vue |       0 |        0 |       0 |       0 | 1-6               
  IconSupport.vue  |       0 |        0 |       0 |       0 | 1-6               
  IconTooling.vue  |       0 |        0 |       0 |       0 | 1-18              
 ...ponents/layout |       0 |        0 |       0 |       0 |                   
  ...ardLayout.vue |       0 |        0 |       0 |       0 | 1-106             
  ...ardLayout.vue |       0 |        0 |       0 |       0 | 1-268             
 src/composables   |    6.15 |    27.27 |   23.07 |    6.15 |                   
  ...hartConfig.ts |       0 |        0 |       0 |       0 | 1-204             
  useKartingAPI.ts |       0 |        0 |       0 |       0 | 1-290             
  ...ifications.ts |   50.72 |    42.85 |   33.33 |   50.72 | ...01-102,108-109 
  ...eVariables.ts |       0 |        0 |       0 |       0 | 1-156             
  useToast.ts      |       0 |        0 |       0 |       0 | 1-50              
 src/router        |       0 |        0 |       0 |       0 |                   
  index.ts         |       0 |        0 |       0 |       0 | 1-157             
 src/services      |   42.23 |    83.33 |     5.1 |   42.23 |                   
  api.ts           |   42.23 |    83.33 |     5.1 |   42.23 | ...35-637,642-644 
 ...ices/__tests__ |     100 |      100 |     100 |     100 |                   
  api.spec.ts      |     100 |      100 |     100 |     100 |                   
 src/stores        |   84.61 |     64.4 |   93.75 |   84.61 |                   
  auth.ts          |   74.46 |    70.58 |      75 |   74.46 | 35-47,58-65,85-88 
  driver.ts        |   90.82 |    72.72 |     100 |   90.82 | ...2,82-83,99-100 
  track.ts         |   87.15 |       50 |     100 |   87.15 | ...3,96-97,99-100 
 ...ores/__tests__ |     100 |      100 |     100 |     100 |                   
  auth.spec.ts     |     100 |      100 |     100 |     100 |                   
  driver.spec.ts   |     100 |      100 |     100 |     100 |                   
  track.spec.ts    |     100 |      100 |     100 |     100 |                   
 src/utils         |       0 |      100 |     100 |       0 |                   
  driverColors.ts  |       0 |      100 |     100 |       0 | 7-85              
 src/views         |       0 |        0 |       0 |       0 |                   
  AboutView.vue    |       0 |        0 |       0 |       0 | 1-4               
  ...nDataView.vue |       0 |        0 |       0 |       0 | 1-371             
  ...taViewNew.vue |       0 |        0 |       0 |       0 | 1-335             
  ...ylingView.vue |       0 |        0 |       0 |       0 | 1-208             
  ...ementView.vue |       0 |        0 |       0 |       0 | 1-375             
  AdminView.vue    |       0 |        0 |       0 |       0 | 1-34              
  BattlesView.vue  |       0 |        0 |       0 |       0 | 1-502             
  ...boardView.vue |       0 |        0 |       0 |       0 | 1-8               
  ...ementView.vue |       0 |        0 |       0 |       0 | 1-283             
  ...StatsView.vue |       0 |        0 |       0 |       0 | 1-105             
  ...ploadView.vue |       0 |        0 |       0 |       0 | 1-1401            
  ...ncialView.vue |       0 |        0 |       0 |       0 | 1-589             
  ...aphicView.vue |       0 |        0 |       0 |       0 | 1-243             
  HomeView.vue     |       0 |        0 |       0 |       0 | 1-1575            
  LoginView.vue    |       0 |        0 |       0 |       0 | 1-83              
  ...ctiveView.vue |       0 |        0 |       0 |       0 | 1-730             
  ...lysisView.vue |       0 |        0 |       0 |       0 | 1-223             
  TemporalView.vue |       0 |        0 |       0 |       0 | 1-692             
  ...ementView.vue |       0 |        0 |       0 |       0 | 1-545             
  ...manceView.vue |       0 |        0 |       0 |       0 | 1-408             
  ...dDataView.vue |       0 |        0 |       0 |       0 | 1-641             
  ...tingsView.vue |       0 |        0 |       0 |       0 | 1-346             
-------------------|---------|----------|---------|---------|-------------------

=== artifacts/python-test-results/test-output.txt ===
============================= test session starts ==============================
platform linux -- Python 3.11.14, pytest-9.0.2, pluggy-1.6.0 -- /opt/hostedtoolcache/Python/3.11.14/x64/bin/python
cachedir: .pytest_cache
rootdir: /home/runner/work/karting/karting/data-importer/scripts
configfile: pytest.ini
testpaths: tests
plugins: cov-7.0.0, mock-3.15.1
collecting ... collected 29 items

tests/test_config.py::TestLoadConfig::test_load_config_from_file PASSED  [  3%]
tests/test_config.py::TestLoadConfig::test_load_config_returns_defaults PASSED [  6%]
tests/test_config.py::TestGetHeatPrice::test_get_heat_price_known_track PASSED [ 10%]
tests/test_config.py::TestGetHeatPrice::test_get_heat_price_unknown_track PASSED [ 13%]
tests/test_config.py::TestGetCostPerLap::test_get_cost_per_lap_known_track PASSED [ 17%]
tests/test_config.py::TestGetCostPerLap::test_get_cost_per_lap_unknown_track PASSED [ 20%]
tests/test_process_karting_sessions.py::TestTimeConversion::test_convert_time_string_to_seconds PASSED [ 24%]
tests/test_process_karting_sessions.py::TestTimeConversion::test_convert_seconds_only_format PASSED [ 27%]
tests/test_process_karting_sessions.py::TestSpeedCalculation::test_calculate_speed_from_distance_and_time FAILED [ 31%]
tests/test_process_karting_sessions.py::TestSpeedCalculation::test_calculate_speed_zero_time_returns_zero FAILED [ 34%]
tests/test_process_karting_sessions.py::TestDuplicateDetection::test_is_duplicate_session_returns_false_for_new FAILED [ 37%]
tests/test_process_karting_sessions.py::TestDuplicateDetection::test_is_duplicate_session_returns_true_for_existing FAILED [ 41%]
tests/test_process_karting_sessions.py::TestSessionNumbering::test_get_session_number_first_of_day FAILED [ 44%]
tests/test_process_karting_sessions.py::TestSessionNumbering::test_get_session_number_increments FAILED [ 48%]
tests/test_process_karting_sessions.py::TestDriverNormalization::test_normalize_driver_name_strips_whitespace FAILED [ 51%]
tests/test_process_karting_sessions.py::TestDriverNormalization::test_normalize_driver_name_handles_aliases FAILED [ 55%]
tests/test_process_karting_sessions.py::TestCSVWriting::test_write_session_to_csv_creates_file FAILED [ 58%]
tests/test_process_karting_sessions.py::TestCSVWriting::test_write_session_appends_to_existing FAILED [ 62%]
tests/test_session_parser.py::TestSessionParser::test_parser_initialization PASSED [ 65%]
tests/test_session_parser.py::TestSessionParser::test_parse_file_with_invalid_path FAILED [ 68%]
tests/test_session_parser.py::TestSessionParser::test_parse_file_detects_eml PASSED [ 72%]
tests/test_session_parser.py::TestSessionParser::test_get_email_body_extracts_content FAILED [ 75%]
tests/test_session_parser.py::TestSessionParser::test_identify_track_from_content FAILED [ 79%]
tests/test_session_parser.py::TestSessionParser::test_convert_to_csv_row_format PASSED [ 82%]
tests/test_session_parser.py::TestBase64Decoding::test_decode_valid_base64 PASSED [ 86%]
tests/test_session_parser.py::TestBase64Decoding::test_decode_base64_with_newlines PASSED [ 89%]
tests/test_session_parser.py::TestLapTimeExtraction::test_extract_lap_time_mm_ss_format PASSED [ 93%]
tests/test_session_parser.py::TestLapTimeExtraction::test_extract_lap_time_ss_mmm_format PASSED [ 96%]
tests/test_session_parser.py::TestLapTimeExtraction::test_extract_multiple_lap_times PASSED [100%]

=================================== FAILURES ===================================
_______ TestSpeedCalculation.test_calculate_speed_from_distance_and_time _______

self = <tests.test_process_karting_sessions.TestSpeedCalculation object at 0x7f1321cba1d0>

    def test_calculate_speed_from_distance_and_time(self):
        """Test speed calculation."""
>       from process_karting_sessions import calculate_speed
E       ImportError: cannot import name 'calculate_speed' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)

tests/test_process_karting_sessions.py:37: ImportError
_______ TestSpeedCalculation.test_calculate_speed_zero_time_returns_zero _______

self = <tests.test_process_karting_sessions.TestSpeedCalculation object at 0x7f1321cba990>

    def test_calculate_speed_zero_time_returns_zero(self):
        """Test that zero time returns zero speed."""
>       from process_karting_sessions import calculate_speed
E       ImportError: cannot import name 'calculate_speed' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)

tests/test_process_karting_sessions.py:45: ImportError
____ TestDuplicateDetection.test_is_duplicate_session_returns_false_for_new ____

self = <tests.test_process_karting_sessions.TestDuplicateDetection object at 0x7f1321cbb490>
temp_csv_file = '/tmp/tmp6rvhhaua.csv'

    def test_is_duplicate_session_returns_false_for_new(self, temp_csv_file):
        """Test new session is not duplicate."""
>       from process_karting_sessions import is_duplicate_session
E       ImportError: cannot import name 'is_duplicate_session' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)

tests/test_process_karting_sessions.py:56: ImportError
__ TestDuplicateDetection.test_is_duplicate_session_returns_true_for_existing __

self = <tests.test_process_karting_sessions.TestDuplicateDetection object at 0x7f1321cb82d0>
temp_csv_file = '/tmp/tmphorr4nt1.csv'

    def test_is_duplicate_session_returns_true_for_existing(self, temp_csv_file):
        """Test existing session is detected as duplicate."""
>       from process_karting_sessions import is_duplicate_session
E       ImportError: cannot import name 'is_duplicate_session' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)

tests/test_process_karting_sessions.py:69: ImportError
__________ TestSessionNumbering.test_get_session_number_first_of_day ___________

self = <tests.test_process_karting_sessions.TestSessionNumbering object at 0x7f1321cb8a90>
temp_csv_file = '/tmp/tmp5h32cga9.csv'

    def test_get_session_number_first_of_day(self, temp_csv_file):
        """Test first session of day gets number 1."""
>       from process_karting_sessions import get_session_number
E       ImportError: cannot import name 'get_session_number' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)

tests/test_process_karting_sessions.py:85: ImportError
___________ TestSessionNumbering.test_get_session_number_increments ____________

self = <tests.test_process_karting_sessions.TestSessionNumbering object at 0x7f1321cb8e10>
temp_csv_file = '/tmp/tmpaqukvuud.csv'

    def test_get_session_number_increments(self, temp_csv_file):
        """Test session number increments for same day/track."""
>       from process_karting_sessions import get_session_number
E       ImportError: cannot import name 'get_session_number' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)

tests/test_process_karting_sessions.py:96: ImportError
_____ TestDriverNormalization.test_normalize_driver_name_strips_whitespace _____

self = <tests.test_process_karting_sessions.TestDriverNormalization object at 0x7f1321cb98d0>

    def test_normalize_driver_name_strips_whitespace(self):
        """Test driver names are trimmed."""
        from process_karting_sessions import normalize_driver_name
    
>       result = normalize_driver_name("  Driver 1  ")
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
E       TypeError: normalize_driver_name() missing 1 required positional argument: 'track_name'

tests/test_process_karting_sessions.py:115: TypeError
______ TestDriverNormalization.test_normalize_driver_name_handles_aliases ______

self = <tests.test_process_karting_sessions.TestDriverNormalization object at 0x7f1322cbc210>

    def test_normalize_driver_name_handles_aliases(self):
        """Test driver aliases are resolved."""
        from process_karting_sessions import normalize_driver_name
    
        # This depends on configured aliases
>       result = normalize_driver_name("Some Alias")
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
E       TypeError: normalize_driver_name() missing 1 required positional argument: 'track_name'

tests/test_process_karting_sessions.py:123: TypeError
____________ TestCSVWriting.test_write_session_to_csv_creates_file _____________

self = <tests.test_process_karting_sessions.TestCSVWriting object at 0x7f1321e082d0>

    def test_write_session_to_csv_creates_file(self):
        """Test writing session creates CSV file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            temp_path = f.name
    
        try:
>           from process_karting_sessions import write_session_to_csv
E           ImportError: cannot import name 'write_session_to_csv' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)

tests/test_process_karting_sessions.py:137: ImportError
____________ TestCSVWriting.test_write_session_appends_to_existing _____________

self = <tests.test_process_karting_sessions.TestCSVWriting object at 0x7f1321e0ba50>
temp_csv_file = '/tmp/tmpfthhm5lp.csv'

    def test_write_session_appends_to_existing(self, temp_csv_file):
        """Test writing session appends to existing file."""
>       from process_karting_sessions import write_session_to_csv
E       ImportError: cannot import name 'write_session_to_csv' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)

tests/test_process_karting_sessions.py:159: ImportError
_____________ TestSessionParser.test_parse_file_with_invalid_path ______________

self = <tests.test_session_parser.TestSessionParser object at 0x7f1321cfd1d0>
parser = <session_parser.SessionParser object at 0x7f13219f9850>

    def test_parse_file_with_invalid_path(self, parser):
        """Test parsing non-existent file returns None or raises."""
>       result = parser.parse_file("/nonexistent/file.eml")
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

tests/test_session_parser.py:29: 
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 

self = <session_parser.SessionParser object at 0x7f13219f9850>
file_path = PosixPath('/nonexistent/file.eml')

    def parse_file(self, file_path: str) -> Dict:
        """
        Main entry point to parse any supported file type
        Returns a dictionary with session data
        """
        file_path = Path(file_path)
    
        if not file_path.exists():
>           raise FileNotFoundError(f"File not found: {file_path}")
E           FileNotFoundError: File not found: /nonexistent/file.eml

session_parser.py:40: FileNotFoundError
---------------------------- Captured stdout setup -----------------------------
Warning: Tracks database not found at tracks.json
____________ TestSessionParser.test_get_email_body_extracts_content ____________

self = <tests.test_session_parser.TestSessionParser object at 0x7f1321cfc510>
parser = <session_parser.SessionParser object at 0x7f132191d3d0>

    def test_get_email_body_extracts_content(self, parser):
        """Test email body extraction from multipart message."""
        msg = EmailMessage()
        msg['Subject'] = 'Test'
        msg.set_content('Plain text content')
        msg.add_alternative('<html><body>HTML content</body></html>', subtype='html')
    
>       body = parser.get_email_body(msg)
               ^^^^^^^^^^^^^^^^^^^^^
E       AttributeError: 'SessionParser' object has no attribute 'get_email_body'

tests/test_session_parser.py:45: AttributeError
---------------------------- Captured stdout setup -----------------------------
Warning: Tracks database not found at tracks.json
______________ TestSessionParser.test_identify_track_from_content ______________

self = <tests.test_session_parser.TestSessionParser object at 0x7f1321cfd250>
parser = <session_parser.SessionParser object at 0x7f13219ec750>

    def test_identify_track_from_content(self, parser):
        """Test track identification from email content."""
        content = "Results from De Voltage karting session"
>       track = parser.identify_track(content)
                ^^^^^^^^^^^^^^^^^^^^^
E       AttributeError: 'SessionParser' object has no attribute 'identify_track'

tests/test_session_parser.py:52: AttributeError
---------------------------- Captured stdout setup -----------------------------
Warning: Tracks database not found at tracks.json
- generated xml file: /home/runner/work/karting/karting/data-importer/scripts/test-results.xml -
================================ tests coverage ================================
_______________ coverage: platform linux, python 3.11.14-final-0 _______________

Name                                     Stmts   Miss  Cover   Missing
----------------------------------------------------------------------
add_session.py                             152    152     0%   6-251
config.py                                   49      6    88%   23-24, 140-143, 152
process_karting_sessions.py                771    735     5%   43-58, 62-70, 84-86, 98-104, 108-316, 320-418, 422-788, 792-802, 806-836, 841-887, 891-981, 985-1142, 1146-1277, 1281-1344, 1347-1358
remove_console_logs.py                      37     37     0%   1-71
run_processing.py                           14     14     0%   5-22
session_parser.py                          214    150    30%   26-27, 45-51, 67, 69, 71, 78-90, 94-146, 150-201, 205-216, 220-240, 244-255, 259, 279, 284, 294-295, 298-301, 311, 313, 315, 317, 319, 321, 323, 332-411, 416-429
tests/__init__.py                            0      0   100%
tests/conftest.py                           32      3    91%   33, 50, 93
tests/test_config.py                        45      0   100%
tests/test_process_karting_sessions.py      92     46    50%   40-41, 47-48, 59-65, 71-77, 87-92, 98-105, 116, 124-125, 139-152, 162-179
tests/test_session_parser.py                76      6    92%   30, 46-47, 54, 67-68
----------------------------------------------------------------------
TOTAL                                     1482   1149    22%
Coverage XML written to file coverage.xml
=========================== short test summary info ============================
FAILED tests/test_process_karting_sessions.py::TestSpeedCalculation::test_calculate_speed_from_distance_and_time - ImportError: cannot import name 'calculate_speed' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)
FAILED tests/test_process_karting_sessions.py::TestSpeedCalculation::test_calculate_speed_zero_time_returns_zero - ImportError: cannot import name 'calculate_speed' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)
FAILED tests/test_process_karting_sessions.py::TestDuplicateDetection::test_is_duplicate_session_returns_false_for_new - ImportError: cannot import name 'is_duplicate_session' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)
FAILED tests/test_process_karting_sessions.py::TestDuplicateDetection::test_is_duplicate_session_returns_true_for_existing - ImportError: cannot import name 'is_duplicate_session' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)
FAILED tests/test_process_karting_sessions.py::TestSessionNumbering::test_get_session_number_first_of_day - ImportError: cannot import name 'get_session_number' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)
FAILED tests/test_process_karting_sessions.py::TestSessionNumbering::test_get_session_number_increments - ImportError: cannot import name 'get_session_number' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)
FAILED tests/test_process_karting_sessions.py::TestDriverNormalization::test_normalize_driver_name_strips_whitespace - TypeError: normalize_driver_name() missing 1 required positional argument: 'track_name'
FAILED tests/test_process_karting_sessions.py::TestDriverNormalization::test_normalize_driver_name_handles_aliases - TypeError: normalize_driver_name() missing 1 required positional argument: 'track_name'
FAILED tests/test_process_karting_sessions.py::TestCSVWriting::test_write_session_to_csv_creates_file - ImportError: cannot import name 'write_session_to_csv' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)
FAILED tests/test_process_karting_sessions.py::TestCSVWriting::test_write_session_appends_to_existing - ImportError: cannot import name 'write_session_to_csv' from 'process_karting_sessions' (/home/runner/work/karting/karting/data-importer/scripts/process_karting_sessions.py)
FAILED tests/test_session_parser.py::TestSessionParser::test_parse_file_with_invalid_path - FileNotFoundError: File not found: /nonexistent/file.eml
FAILED tests/test_session_parser.py::TestSessionParser::test_get_email_body_extracts_content - AttributeError: 'SessionParser' object has no attribute 'get_email_body'
FAILED tests/test_session_parser.py::TestSessionParser::test_identify_track_from_content - AttributeError: 'SessionParser' object has no attribute 'identify_track'
======================== 13 failed, 16 passed in 0.74s =========================

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
