const fs = require('fs');
const path = require('path');
const uuid = require('uuid/v1');
const errorMessages = require('./errorMessages');

/**
 * @summary
 *  Given an array of filenames which consist in mochawesome reports, the function
 * merges all of them into a single file and outputs the given file to the given
 * path with the given file name.
 * @param {[String]} fileNames
 *  An array of files consisting in mochawesome reports.
 * @param {String} outputFileName
 *  The full name (path included) of the resulted file.
 */
module.exports = function (fileNames, outputFileName) {
    validateInputParameters(fileNames, outputFileName);

    let defaultReport = getEmptyReport();
    let reportFiles = getReportFiles(fileNames);

    computeReportStats(defaultReport, reportFiles);
    addTestSuitesToDefaultReport(defaultReport, reportFiles);
    writeOutputFile(defaultReport, outputFileName);
}

/**
 * @summary
 *  Validates that the list of file names and the output file name are valid.
 * @param {[String]} fileNames
 *  The list of file names to be validated.
 * @param {String} outputFileName
 *  The name of the output file name to be validated.
 */
function validateInputParameters (fileNames, outputFileName) {
    validateFileNamesParameter(fileNames);
    validateOutputFileNameParameter(outputFileName);
}

/**
 * @summary
 *  Validates the "fileNames" input parameter by checking that:
 *  - It is defined
 *  - Is it an array
 *  - It has the length greater than 0
 *  - Each file name is of type string
 * @param {[String]} fileNames
 *  The list of report file names to be validated.
 */
function validateFileNamesParameter (fileNames) {
    if (!fileNames) {
        throw errorMessages.NoReportsSpecified;
    }

    if (!Array.isArray(fileNames)) {
        throw errorMessages.IncorrectTypeForFileNames;
    }

    if (fileNames.length == 0) {
        throw errorMessages.NoSpecifiedReportFile;
    }

    fileNames.forEach(fileName => {
        if (typeof (fileName) !== 'string') {
            throw errorMessages.InvalidFileNameType;
        }
    });
}

/**
 * @summary
 *  Validates that the given "outputFileName" parameter is valid by checking that:
 *  - It is defined
 *  - It is of type string
 *  - It is not an empty string
 * @param {String} outputFileName
 *  The name of the output file name to be validated.
 */
function validateOutputFileNameParameter (outputFileName) {
    if (!outputFileName) {
        throw errorMessages.OutputFileNotSpecified;
    }

    if (typeof (outputFileName) !== 'string') {
        throw errorMessages.InvalidOututFileNameType;
    }
}

/**
 * @summary
 *  Gets the default empty Mochawesome report from the "lib" directory.
 * @returns
 *  A JSON object containing the empty Mochawesome report.
 */
function getEmptyReport () {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'default-report.json')));
}

/**
 * @summary
 *  Reads and parses the contents of the given file names from the disk.
 * @param {[String]} fileNames
 *  The list of file names to be read and parsed.
 */
function getReportFiles (fileNames) {
    let reportFiles = [];
    fileNames.forEach(fileName => {
        let reportFile = JSON.parse(fs.readFileSync(fileName));
        reportFiles.push(reportFile);
    });
    return reportFiles;
}

/**
 * @summary
 *  Computes the top level report stats of all the given reports and sets the stats
 * on the given default report.
 * @param {Object} defaultReport
 *  The default Mochawesome report where the top-level report stats will be computed.
 * @param {[Object]} reports
 *  A list of Mochawesome reports to get stats from.
 */
function computeReportStats (defaultReport, reports) {
    addReportStatsToDefaultReport(defaultReport, reports);
    addStartAndEndDateToDefaultreport(defaultReport, reports);
    computePassPercent(defaultReport);
    computePendingPercent(defaultReport);
}

/**
 * @summary
 *  Adds the already computed report stats to the default Mochawesome report.
 * @param {Object} defaultReport
 *  The default Mochawesome report to add the already computed report stats of each given report to.
 * @param {[Object]} reports
 *  A list of Mochawesome reports to get stats from.
 */
function addReportStatsToDefaultReport (defaultReport, reports) {
    let defaultReportStats = defaultReport.stats;

    reports.forEach(report => {
        let reportStats = report.stats;
        defaultReportStats.suites += reportStats.suites;
        defaultReportStats.tests += reportStats.tests;
        defaultReportStats.passes += reportStats.passes;
        defaultReportStats.pending += reportStats.pending;
        defaultReportStats.failures += reportStats.failures;
        defaultReportStats.duration += reportStats.duration;
        defaultReportStats.testsRegistered += reportStats.testsRegistered;
        defaultReportStats.skipped += reportStats.skipped;

        defaultReport.suites
    });
}

/**
 * @summary
 *  Adds the start and end date to the default Mochawesome report by getting them from
 * the given report files.
 *  - The start date will be the oldest "start" value of the given Mochawesome reports.
 *  - The end date will be the newest "end" value of the given Mochawesome reports.
 * @param {Object} defaultReport
 *  The default Mochawesome report to set the start and end date to.
 * @param {[Object]} reports
 *  A list of Mochawesome reports to get the start dates and end dates from.
 */
function addStartAndEndDateToDefaultreport (defaultReport, reports) {
    let startDate = new Date();
    let endDate = new Date(1970, 0, 1);

    reports.forEach(report => {
        let reportStartDate = new Date(report.stats.start);
        if (reportStartDate < startDate) {
            startDate = reportStartDate;
        }

        let reportEndDate = new Date(report.stats.end);
        if (reportEndDate > endDate) {
            endDate = reportEndDate;
        }
    });

    defaultReport.stats.start = startDate;
    defaultReport.stats.end = endDate;
}

/**
 * @summary
 *  Computes the pass percentage of a report based on its top-level stats.
 * @param {Object} report
 *  The report to compute the pass percentage for.
 */
function computePassPercent (report) {
    let stats = report.stats;
    let passPercent = (stats.passes * 100) / stats.testsRegistered;
    stats.passPercent = Number(passPercent.toFixed(2));
    stats.passPercentClass = getPercentClass(passPercent);
}

/**
 * Returns a string which represents the "Pass" class for a given report as follows:
 *  - If the pass rate is greater than 80, the percent class will be "passed".
 *  - If the pass rate is between 50 and 80, the percent class will be "warning"
 *  - If the pass rate is smaller than 50, the percent class will be "failed"
 * @param {Number} percent
 *  The percent based on which to compute the percent class.
 * @returns
 *  The computed percent class.
 */
function getPercentClass (percent) {
    if (percent > 80) {
        return 'success';
    }
    else if (percent > 50) {
        return 'warning';
    }
    else {
        return 'danger';
    }
}

/**
 * @summary
 *  Computes the pending percentage of a report based on its top-level stats.
 * @param {Object} report
 *  The report to compute the pending percentage for.
 */
function computePendingPercent (report) {
    let stats = report.stats;
    let pendingPercent = (stats.pending * 100) / stats.testsRegistered;
    stats.pendingPercent = Number(pendingPercent.toFixed(2));
    stats.pendingPercentClass = getPercentClass(pendingPercent);
}

/**
 * @summary
 *  Adds each report test suites to the default "Mochawesome" report.
 * @param {Object} defaultReport
 *  The default "Mochawesome" report to add test suites to.
 * @param {[Object]} reports
 *  A list of Mochawesome reports to copy the test suites from.
 */
function addTestSuitesToDefaultReport (defaultReport, reports) {
    let defaultReportSuites = defaultReport.suites;
    defaultReportSuites.uuid = uuid();

    reports.forEach(report => {
        let reportSuites = report.suites;
        if (reportSuites && reportSuites.suites.length > 0) {
            reportSuites.suites.forEach(suite => {
                updateTimedOut(suite);
                defaultReportSuites.suites.push(suite);
            });
        }
    });
}

/**
 * @summary
 *  Updates the "timedOut" value of each test in a suite.
 * @param {Object} suite
 *  A suite of tests or sub-suites to update the "timedOut" value for.
 */
function updateTimedOut (suite) {
    let suiteTests = suite.tests;
    if (suiteTests && suiteTests.length > 0) {
        suiteTests.forEach(test => {
            test.timedOut = false;
        });
    }

    let subSuite = suite.suite;
    if (subSuite && subSuite.length > 0) {
        updateTimedOut(subSuite);
    }
}

/**
 * @summary
 *  Writes the given report object into a file under the specified file name.
 * @param {Object} report
 *  The Mochawesome report to be written to the file.
 * @param {String} outputFileName
 *  Specifies the name of the output file which will contain the report.
 */
function writeOutputFile (report, outputFileName) {
    fs.writeFileSync(
        outputFileName,
        JSON.stringify(report),
        { flag: 'w' },
        (error) => {
            if (error) throw error;
        });
}