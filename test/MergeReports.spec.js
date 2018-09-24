const fs = require('fs');
const path = require('path');

const errorMessages = require('../lib/errorMessages');
const merger = require('../index');

describe('Merge Repports', function () {
    it('Should compute start date and end date properly.', function () {
        const expectedStartDate = '2018-07-30T12:38:09.988Z';
        const expectedEndDate = '2018-09-30T12:38:19.607Z';
        const reportFileNames = getReportsFileNames();
        const outputFileName = 'FinalReport.json';

        merger.mergeMochawesomeReports(reportFileNames, outputFileName);

        const generatedReport = JSON.parse(fs.readFileSync(path.join(__dirname, '/../' + outputFileName)));
        expect(generatedReport.stats.start).toEqual(expectedStartDate);
        expect(generatedReport.stats.end).toEqual(expectedEndDate);

    });

    function getReportsFileNames () {
        return [
            'test/assets/SingleTestFailedReport.json',
            'test/assets/TwoTestsOneFailOnePass.json',
            'test/assets/TwoTestsPassReport.json'
        ]
    }

    it('Should compute stats correctly.', function () {
        const reportFileNames = getReportsFileNames();
        const outputFileName = 'FinalReport.json';

        merger.mergeMochawesomeReports(reportFileNames, outputFileName);

        const generatedReport = JSON.parse(fs.readFileSync(path.join(__dirname, '/../' + outputFileName)));
        validateComputedStats(generatedReport);
        validateMergedSuites(generatedReport);
    });

    function validateComputedStats (generatedReport) {
        const ExpectedSuiteCount = 3
        const expectedTestsCount = 5;
        const ExpectedPassedCount = 3;
        const ExpectedPendingCount = 0;
        const ExpectedFailedCount = 2;
        const ExpectedTotalDuration = 7500;
        const ExpectedTestsRegistered = 5;
        const ExpectedPassPercent = 60;
        const ExpectedPendingPercent = 0;
        const ExpectedPassPercentClass = 'warning';
        const ExpectedPendingPercentClass = 'danger';

        const actualReportStats = generatedReport.stats;

        expect(actualReportStats.suites).toEqual(ExpectedSuiteCount);
        expect(actualReportStats.tests).toEqual(expectedTestsCount);
        expect(actualReportStats.passes).toEqual(ExpectedPassedCount);
        expect(actualReportStats.pending).toEqual(ExpectedPendingCount);
        expect(actualReportStats.failures).toEqual(ExpectedFailedCount);
        expect(actualReportStats.duration).toEqual(ExpectedTotalDuration);
        expect(actualReportStats.testsRegistered).toEqual(ExpectedTestsRegistered);
        expect(actualReportStats.passPercent).toEqual(ExpectedPassPercent);
        expect(actualReportStats.pendingPercent).toEqual(ExpectedPendingPercent);
        expect(actualReportStats.passPercentClass).toEqual(ExpectedPassPercentClass);
        expect(actualReportStats.pendingPercentClass).toEqual(ExpectedPendingPercentClass);
    }

    function validateMergedSuites (generatedReport) {
        const ExpectedTestSuiteCount = 3;

        const actualReportSuites = generatedReport.suites;

        expect(actualReportSuites.suites.length).toEqual(ExpectedTestSuiteCount);
    }

    it('Should return error message for invalid inputs.', function () {
        const TestCases = [
            {
                fileNames: null,
                outputFileName: '',
                expectedErrorMessage: errorMessages.NoReportsSpecified
            },
            {
                fileNames: 'test.json',
                outputFileName: '',
                expectedErrorMessage: errorMessages.IncorrectTypeForFileNames
            },
            {
                fileNames: [],
                outputFileName: '',
                expectedErrorMessage: errorMessages.NoSpecifiedReportFile
            },
            {
                fileNames: [1],
                outputFileName: '',
                expectedErrorMessage: errorMessages.InvalidFileNameType
            },
            {
                fileNames: ['test1.json'],
                outputFileName: undefined,
                expectedErrorMessage: errorMessages.OutputFileNotSpecified
            },
            {
                fileNames: ['test1.json'],
                outputFileName: 1,
                expectedErrorMessage: errorMessages.InvalidOututFileNameType
            },
            {
                fileNames: ['test1.json'],
                outputFileName: '',
                expectedErrorMessage: errorMessages.OutputFileNotSpecified
            }
        ];

        TestCases.forEach(testCase => {
            expect(function () { merger.mergeMochawesomeReports(testCase.fileNames, testCase.outputFileName) })
                .toThrow(testCase.expectedErrorMessage);
        });

    });
})