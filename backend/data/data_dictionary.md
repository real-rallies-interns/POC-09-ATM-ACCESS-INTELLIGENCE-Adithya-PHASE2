# Cash Access Intelligence Platform Mock Data Package

## Synthetic Data Notice
Every record in this package is synthetic and labelled `synthetic_mock_data`. It is created for academic PoC simulation, UI testing, and backend integration only.

## Entities
| Entity | Purpose |
|---|---|
| AccessPoint | Synthetic ATM or bank location used for map visualization and scoring. |
| AreaProfile | Synthetic area-level pressure profile used by dashboard intelligence. |
| EdgeCase | Synthetic unusual/error scenario for testing system behavior. |

## AccessPoint Fields
| Field | Definition |
|---|---|
| record_id | Unique synthetic record id. |
| synthetic_label | `SYNTHETIC_RECORD` or `SYNTHETIC_EDGE_CASE`. |
| name | Synthetic ATM or branch name. |
| type | `ATM` or `Bank`. |
| operator | Synthetic bank/operator name. |
| area | City/region used by frontend dropdown. |
| area_id | Short stable area code. |
| state | State/region name. |
| region | Broad India region. |
| lat | Synthetic latitude. |
| lng | Synthetic longitude. |
| status | `active` or `temporarily_unavailable`. |
| cash_availability | ATM cash availability simulation. |
| accessibility | `24x7` or `business_hours`. |
| road_access | Road/location access category. |
| source_type | Mock source category. |
| scenario_label | Scenario category. |
| data_label | Always `synthetic_mock_data`. |
| notes | Additional explanation. |

## Edge Cases
- ZeroATM Nagar: no ATM but some banks.
- BankOnly Puram: bank-only area, no ATMs.
- Remote Gap Block: very high travel burden with minimal access.
- Temporary outage case: unavailable ATM should not improve coverage.

## Files Included
- access_points.json / access_points.csv
- area_profiles.json / area_profiles.csv
- edge_cases.json / edge_cases.csv
- data_dictionary.json
- data_dictionary.md
