<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\QcReportTemplate;

class QcReportTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'test_type' => 'Blocks',
                'name' => 'Concrete Block Test Report',
                'description' => 'Professional report for concrete masonry block testing.',
                'design' => $this->makeDesign(
                    'CONCRETE BLOCK TEST REPORT',
                    'QUALITY & CONTROL DEPARTMENT',
                    [
                        ['Report Number', '', 'Test Date', ''],
                        ['Customer', '', 'Project / Site', ''],
                        ['Block Type', '', 'Manufacturing Plant', ''],
                        ['Block Size', '', 'Production Date', ''],
                        ['Sample Reference', '', 'Testing Date', ''],
                    ],
                    [
                        ['Specimen', 'Length (mm)', 'Width (mm)', 'Height (mm)', 'Weight (kg)', 'Load (kN)', 'Strength (N/mm²)', 'Absorption (%)'],
                        ['1', '', '', '', '', '', '', ''],
                        ['2', '', '', '', '', '', '', ''],
                        ['3', '', '', '', '', '', '', ''],
                        ['4', '', '', '', '', '', '', ''],
                        ['5', '', '', '', '', '', '', ''],
                        ['Mean', '', '', '', '', '', '', ''],
                    ],
                    [
                        'TEST RESULTS',
                        'Average Compressive Strength: __________________________',
                        'Average Water Absorption: ______________________________',
                        'Density: ______________________________________________',
                        'Applicable Standard / Specification: _____________________',
                        'Acceptance Criteria: As per approved project specification.',
                    ]
                ),
            ],
            [
                'test_type' => 'Paving Blocks',
                'name' => 'Paving Block Test Report',
                'description' => 'Paving block dimensions, strength and absorption report.',
                'design' => $this->makeDesign(
                    'PAVING BLOCK TEST REPORT',
                    'QUALITY & CONTROL DEPARTMENT',
                    [
                        ['Report Number', '', 'Test Date', ''],
                        ['Customer', '', 'Project / Site', ''],
                        ['Product Type', '', 'Colour', ''],
                        ['Nominal Dimensions', '', 'Production Date', ''],
                        ['Sample Reference', '', 'Testing Date', ''],
                    ],
                    [
                        ['Specimen', 'Length (mm)', 'Width (mm)', 'Thickness (mm)', 'Weight (kg)', 'Strength', 'Unit', 'Absorption (%)'],
                        ['1', '', '', '', '', '', '', ''],
                        ['2', '', '', '', '', '', '', ''],
                        ['3', '', '', '', '', '', '', ''],
                        ['4', '', '', '', '', '', '', ''],
                        ['5', '', '', '', '', '', '', ''],
                        ['Mean', '', '', '', '', '', '', ''],
                    ],
                    [
                        'TEST RESULTS',
                        'Average Strength: _____________________________________',
                        'Average Water Absorption: ______________________________',
                        'Dimensional Compliance: _______________________________',
                        'Applicable Standard / Specification: _____________________',
                        'Acceptance Criteria: As per approved product specification.',
                    ]
                ),
            ],
            [
                'test_type' => 'Sand Sieve',
                'name' => 'Sand Sieve Analysis Report',
                'description' => 'Particle size distribution report for sand samples.',
                'design' => $this->makeDesign(
                    'SAND SIEVE ANALYSIS REPORT',
                    'QUALITY & CONTROL DEPARTMENT',
                    [
                        ['Report Number', '', 'Sample Date', ''],
                        ['Supplier', '', 'Material Source', ''],
                        ['Material Description', '', 'Sample Reference', ''],
                        ['Test Date', '', 'Tested By', ''],
                        ['Total Sample Weight (g)', '', 'Specification', ''],
                    ],
                    [
                        ['Sieve Size (mm)', 'Weight Retained (g)', '% Retained', 'Cumulative % Retained', '% Passing', 'Specification Limit'],
                        ['5.00', '', '', '', '', ''],
                        ['2.36', '', '', '', '', ''],
                        ['1.18', '', '', '', '', ''],
                        ['0.600', '', '', '', '', ''],
                        ['0.300', '', '', '', '', ''],
                        ['0.150', '', '', '', '', ''],
                        ['0.075', '', '', '', '', ''],
                        ['Pan', '', '', '', '', ''],
                        ['Total', '', '', '', '', ''],
                    ],
                    [
                        'TEST SUMMARY',
                        'Fineness Modulus: _____________________________________',
                        'Material Description: __________________________________',
                        'Grading Assessment: ___________________________________',
                        'Applicable Standard / Specification: _____________________',
                        'Acceptance Criteria: As per approved material specification.',
                    ]
                ),
            ],
            [
                'test_type' => 'Aggregate Sieve',
                'name' => 'Aggregate Sieve Analysis Report',
                'description' => 'Particle size distribution report for coarse and fine aggregates.',
                'design' => $this->makeDesign(
                    'AGGREGATE SIEVE ANALYSIS REPORT',
                    'QUALITY & CONTROL DEPARTMENT',
                    [
                        ['Report Number', '', 'Sample Date', ''],
                        ['Supplier', '', 'Material Source', ''],
                        ['Aggregate Type', '', 'Nominal Size', ''],
                        ['Sample Reference', '', 'Test Date', ''],
                        ['Total Sample Weight (g)', '', 'Tested By', ''],
                    ],
                    [
                        ['Sieve Size (mm)', 'Weight Retained (g)', '% Retained', 'Cumulative % Retained', '% Passing', 'Specification Limit'],
                        ['20.0', '', '', '', '', ''],
                        ['14.0', '', '', '', '', ''],
                        ['10.0', '', '', '', '', ''],
                        ['5.0', '', '', '', '', ''],
                        ['2.36', '', '', '', '', ''],
                        ['1.18', '', '', '', '', ''],
                        ['0.600', '', '', '', '', ''],
                        ['0.300', '', '', '', '', ''],
                        ['0.150', '', '', '', '', ''],
                        ['0.075', '', '', '', '', ''],
                        ['Pan', '', '', '', '', ''],
                        ['Total', '', '', '', '', ''],
                    ],
                    [
                        'TEST SUMMARY',
                        'Grading Assessment: ___________________________________',
                        'Material Fines / Dust Content: ___________________________',
                        'Material Description: __________________________________',
                        'Applicable Standard / Specification: _____________________',
                        'Acceptance Criteria: As per approved material specification.',
                    ]
                ),
            ],
            [
                'test_type' => 'Water',
                'name' => 'Water Quality Test Report',
                'description' => 'Chemical and physical water quality test report.',
                'design' => $this->makeDesign(
                    'WATER QUALITY TEST REPORT',
                    'QUALITY & CONTROL DEPARTMENT',
                    [
                        ['Report Number', '', 'Sample Date', ''],
                        ['Sample Source', '', 'Sampling Location', ''],
                        ['Sample Reference', '', 'Sampled By', ''],
                        ['Testing Date', '', 'Tested By', ''],
                        ['Water Type', '', 'Specification', ''],
                    ],
                    [
                        ['Test Parameter', 'Test Method', 'Result', 'Unit', 'Specification Limit', 'Status'],
                        ['pH', '', '', '', '', ''],
                        ['Chloride', '', '', '', '', ''],
                        ['Sulphate', '', '', '', '', ''],
                        ['Total Dissolved Solids', '', '', '', '', ''],
                        ['Conductivity', '', '', '', '', ''],
                        ['Other', '', '', '', '', ''],
                    ],
                    [
                        'TEST SUMMARY',
                        'Overall Assessment: ___________________________________',
                        'Remarks: _____________________________________________',
                        'Applicable Standard / Specification: _____________________',
                        'Acceptance Criteria: As per approved water specification.',
                    ]
                ),
            ],
            [
                'test_type' => 'Kerb Stone',
                'name' => 'Kerb Stone Test Report',
                'description' => 'Concrete kerb stone dimensions and strength test report.',
                'design' => $this->makeDesign(
                    'KERB STONE TEST REPORT',
                    'QUALITY & CONTROL DEPARTMENT',
                    [
                        ['Report Number', '', 'Test Date', ''],
                        ['Customer', '', 'Project / Site', ''],
                        ['Kerb Profile / Type', '', 'Production Plant', ''],
                        ['Sample Reference', '', 'Production Date', ''],
                        ['Nominal Dimensions', '', 'Testing Date', ''],
                    ],
                    [
                        ['Specimen', 'Length (mm)', 'Width (mm)', 'Height (mm)', 'Weight (kg)', 'Failure Load (kN)', 'Strength (N/mm²)', 'Absorption (%)'],
                        ['1', '', '', '', '', '', '', ''],
                        ['2', '', '', '', '', '', '', ''],
                        ['3', '', '', '', '', '', '', ''],
                        ['4', '', '', '', '', '', '', ''],
                        ['5', '', '', '', '', '', '', ''],
                        ['Mean', '', '', '', '', '', '', ''],
                    ],
                    [
                        'TEST RESULTS',
                        'Average Strength: _____________________________________',
                        'Average Water Absorption: ______________________________',
                        'Dimensional Compliance: _______________________________',
                        'Applicable Standard / Specification: _____________________',
                        'Acceptance Criteria: As per approved kerb stone specification.',
                    ]
                ),
            ],
        ];

        foreach ($templates as $template) {
            QcReportTemplate::firstOrCreate(
                [
                    'test_type' => $template['test_type'],
                    'name' => $template['name'],
                ],
                [
                    'description' => $template['description'],
                    'is_default' => true,
                    'version' => 1,
                    'design' => $template['design'],
                    'history' => [],
                ]
            );
        }
    }

    private function makeDesign(
        string $title,
        string $subtitle,
        array $metadataRows,
        array $testRows,
        array $summaryLines
    ): array {
        $elements = [];

        $elements[] = $this->textElement(
            $title, 40, 28, 714, 38, 23, true, 'center'
        );

        $elements[] = $this->textElement(
            $subtitle, 40, 70, 714, 25, 13, true, 'center'
        );

        $elements[] = $this->lineElement(40, 105, 714);

        $elements[] = $this->textElement(
            'REPORT INFORMATION', 40, 120, 714, 25, 14, true
        );

        $elements[] = $this->tableElement(
            $metadataRows, 40, 150, 714, 150, [25, 25, 25, 25]
        );

        $elements[] = $this->textElement(
            'TEST DATA', 40, 325, 714, 25, 14, true
        );

        $elements[] = $this->tableElement(
            $testRows,
            40,
            355,
            714,
            count($testRows) * 34,
            array_fill(0, count($testRows[0]), 100 / count($testRows[0]))
        );

        $summaryY = 355 + count($testRows) * 34 + 30;

        $elements[] = $this->textElement(
            $summaryLines[0], 40, $summaryY, 714, 25, 14, true
        );

        foreach (array_slice($summaryLines, 1) as $index => $line) {
            $elements[] = $this->textElement(
                $line,
                40,
                $summaryY + 30 + ($index * 30),
                714,
                25,
                12
            );
        }

        $signatureY = min(970, $summaryY + 30 + (count($summaryLines) * 30) + 25);

        $elements[] = $this->lineElement(40, $signatureY, 714);

        $elements[] = $this->textElement(
            'TESTED BY: __________________________',
            40, $signatureY + 18, 220, 30, 11
        );

        $elements[] = $this->textElement(
            'CHECKED BY: _________________________',
            285, $signatureY + 18, 220, 30, 11
        );

        $elements[] = $this->textElement(
            'APPROVED BY: ________________________',
            525, $signatureY + 18, 229, 30, 11
        );

        $elements[] = $this->textElement(
            'Al Manaratain - Quality & Control',
            40, 1050, 714, 22, 10, false, 'center'
        );

        return [
            'page' => [
                'size' => 'A4',
                'orientation' => 'portrait',
                'margins' => [
                    'top' => 20,
                    'bottom' => 20,
                    'left' => 15,
                    'right' => 15,
                ],
            ],
            'elements' => $elements,
        ];
    }

    private function textElement(
        string $text,
        int $x,
        int $y,
        int $width,
        int $height,
        int $fontSize = 13,
        bool $bold = false,
        string $align = 'left'
    ): array {
        return [
            'id' => 'element-' . uniqid(),
            'type' => 'text',
            'x' => $x,
            'y' => $y,
            'width' => $width,
            'height' => $height,
            'text' => $text,
            'fontSize' => $fontSize,
            'color' => '#243247',
            'background' => 'transparent',
            'bold' => $bold,
            'align' => $align,
        ];
    }

    private function lineElement(int $x, int $y, int $width): array
    {
        return [
            'id' => 'element-' . uniqid(),
            'type' => 'line',
            'x' => $x,
            'y' => $y,
            'width' => $width,
            'height' => 3,
            'text' => '',
            'fontSize' => 12,
            'color' => '#17365d',
            'background' => 'transparent',
            'bold' => false,
            'align' => 'left',
        ];
    }

    private function tableElement(
        array $rows,
        int $x,
        int $y,
        int $width,
        int $height,
        array $columnWidths
    ): array {
        $columnCount = count($rows[0]);

        $columnWidths = array_slice($columnWidths, 0, $columnCount);

        return [
            'id' => 'element-' . uniqid(),
            'type' => 'table',
            'x' => $x,
            'y' => $y,
            'width' => $width,
            'height' => $height,
            'text' => implode(' | ', $rows[0]),
            'fontSize' => 10,
            'color' => '#344054',
            'background' => '#ffffff',
            'bold' => false,
            'align' => 'center',
            'tableData' => [
                'rows' => $rows,
                'columnWidths' => $columnWidths,
            ],
        ];
    }
}
