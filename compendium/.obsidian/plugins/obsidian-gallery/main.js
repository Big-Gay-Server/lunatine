'use strict';

var obsidian = require('obsidian');
var child_process = require('child_process');
require('path');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var tsExifParser = {};

var ExifParserFactory$1 = {};

var ExifParser$1 = {};

var simplify = {};

var ExifSectionParser = {};

(function (exports) {
	/*jslint browser: true, devel: true, bitwise: false, debug: true, eqeq: false, es5: true, evil: false, forin: false, newcap: false, nomen: true, plusplus: true, regexp: false, unparam: false, sloppy: true, stupid: false, sub: false, todo: true, lets: true, white: true */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ExifSectionParser = exports.ExifSections = void 0;
	var ExifSections;
	(function (ExifSections) {
	    ExifSections[ExifSections["IFD0"] = 1] = "IFD0";
	    ExifSections[ExifSections["IFD1"] = 2] = "IFD1";
	    ExifSections[ExifSections["GPSIFD"] = 3] = "GPSIFD";
	    ExifSections[ExifSections["SubIFD"] = 4] = "SubIFD";
	    ExifSections[ExifSections["InteropIFD"] = 5] = "InteropIFD";
	})(ExifSections = exports.ExifSections || (exports.ExifSections = {}));
	var ExifSectionParser = /** @class */ (function () {
	    function ExifSectionParser() {
	    }
	    ExifSectionParser.parseTags = function (stream, iterator) {
	        var tiffMarker;
	        try {
	            tiffMarker = ExifSectionParser.readHeader(stream);
	        }
	        catch (e) {
	            return false; //ignore APP1 sections with invalid headers
	        }
	        var subIfdOffset, gpsOffset, interopOffset;
	        var ifd0Stream = tiffMarker.openWithOffset(stream.nextUInt32()), IFD0 = ExifSections.IFD0;
	        ExifSectionParser.readIFDSection(tiffMarker, ifd0Stream, function (tagType, value, format) {
	            switch (tagType) {
	                case 0x8825:
	                    gpsOffset = value[0];
	                    break;
	                case 0x8769:
	                    subIfdOffset = value[0];
	                    break;
	                default:
	                    iterator(IFD0, tagType, value, format);
	                    break;
	            }
	        });
	        var ifd1Offset = ifd0Stream.nextUInt32();
	        if (ifd1Offset !== 0) {
	            var ifd1Stream = tiffMarker.openWithOffset(ifd1Offset);
	            ExifSectionParser.readIFDSection(tiffMarker, ifd1Stream, iterator.bind(null, ExifSections.IFD1));
	        }
	        if (gpsOffset) {
	            var gpsStream = tiffMarker.openWithOffset(gpsOffset);
	            ExifSectionParser.readIFDSection(tiffMarker, gpsStream, iterator.bind(null, ExifSections.GPSIFD));
	        }
	        if (subIfdOffset) {
	            var subIfdStream = tiffMarker.openWithOffset(subIfdOffset), InteropIFD_1 = ExifSections.InteropIFD;
	            ExifSectionParser.readIFDSection(tiffMarker, subIfdStream, function (tagType, value, format) {
	                if (tagType === 0xA005) {
	                    interopOffset = value[0];
	                }
	                else {
	                    iterator(InteropIFD_1, tagType, value, format);
	                }
	            });
	        }
	        if (interopOffset) {
	            var interopStream = tiffMarker.openWithOffset(interopOffset);
	            ExifSectionParser.readIFDSection(tiffMarker, interopStream, iterator.bind(null, ExifSections.InteropIFD));
	        }
	        return true;
	    };
	    ExifSectionParser.readExifValue = function (format, stream) {
	        switch (format) {
	            case 1:
	                return stream.nextUInt8();
	            case 3:
	                return stream.nextUInt16();
	            case 4:
	                return stream.nextUInt32();
	            case 5:
	                return [stream.nextUInt32(), stream.nextUInt32()];
	            case 6:
	                return stream.nextInt8();
	            case 8:
	                return stream.nextUInt16();
	            case 9:
	                return stream.nextUInt32();
	            case 10:
	                return [stream.nextInt32(), stream.nextInt32()];
	            case 11:
	                return stream.nextFloat();
	            case 12:
	                return stream.nextDouble();
	            default:
	                throw new Error('Invalid format while decoding: ' + format);
	        }
	    };
	    ExifSectionParser.getBytesPerComponent = function (format) {
	        switch (format) {
	            case 1:
	            case 2:
	            case 6:
	            case 7:
	                return 1;
	            case 3:
	            case 8:
	                return 2;
	            case 4:
	            case 9:
	            case 11:
	                return 4;
	            case 5:
	            case 10:
	            case 12:
	                return 8;
	            default:
	                return 0;
	        }
	    };
	    ExifSectionParser.readExifTag = function (tiffMarker, stream) {
	        var tagType = stream.nextUInt16(), format = stream.nextUInt16(), bytesPerComponent = ExifSectionParser.getBytesPerComponent(format), components = stream.nextUInt32(), valueBytes = bytesPerComponent * components, values, c;
	        /* if the value is bigger then 4 bytes, the value is in the data section of the IFD
	        and the value present in the tag is the offset starting from the tiff header. So we replace the stream
	        with a stream that is located at the given offset in the data section. s*/
	        if (valueBytes > 4) {
	            stream = tiffMarker.openWithOffset(stream.nextUInt32());
	        }
	        //we don't want to read strings as arrays
	        if (format === 2) {
	            values = stream.nextString(components);
	            //cut off \0 characters
	            var lastNull = values.indexOf('\0');
	            if (lastNull !== -1) {
	                values = values.substr(0, lastNull);
	            }
	        }
	        else if (format === 7) {
	            values = stream.nextBuffer(components);
	        }
	        else if (format !== 0) {
	            values = [];
	            for (c = 0; c < components; ++c) {
	                values.push(ExifSectionParser.readExifValue(format, stream));
	            }
	        }
	        //since our stream is a stateful object, we need to skip remaining bytes
	        //so our offset stays correct
	        if (valueBytes < 4) {
	            stream.skip(4 - valueBytes);
	        }
	        return [tagType, values, format];
	    };
	    ExifSectionParser.readIFDSection = function (tiffMarker, stream, iterator) {
	        // make sure we can read nextUint16 byte
	        if (stream.remainingLength() < 2) {
	            return;
	        }
	        var numberOfEntries = stream.nextUInt16(), tag, i;
	        for (i = 0; i < numberOfEntries; ++i) {
	            tag = ExifSectionParser.readExifTag(tiffMarker, stream);
	            iterator(tag[0], tag[1], tag[2]);
	        }
	    };
	    ExifSectionParser.readHeader = function (stream) {
	        var exifHeader = stream.nextString(6);
	        if (exifHeader !== 'Exif\0\0') {
	            throw new Error('Invalid EXIF header');
	        }
	        var tiffMarker = stream.mark();
	        var tiffHeader = stream.nextUInt16();
	        if (tiffHeader === 0x4949) {
	            stream.setBigEndian(false);
	        }
	        else if (tiffHeader === 0x4D4D) {
	            stream.setBigEndian(true);
	        }
	        else {
	            throw new Error('Invalid TIFF header');
	        }
	        if (stream.nextUInt16() !== 0x002A) {
	            throw new Error('Invalid TIFF data');
	        }
	        return tiffMarker;
	    };
	    return ExifSectionParser;
	}());
	exports.ExifSectionParser = ExifSectionParser;
	
} (ExifSectionParser));

var DateUtil$1 = {};

Object.defineProperty(DateUtil$1, "__esModule", { value: true });
DateUtil$1.DateUtil = void 0;
var DateUtil = /** @class */ (function () {
    function DateUtil() {
    }
    DateUtil.parseNumber = function (s) {
        return parseInt(s, 10);
    };
    /**
     * take date (year, month, day) and time (hour, minutes, seconds) digits in UTC
     * and return a timestamp in seconds
     * @param dateParts
     * @param timeParts
     * @returns {number}
     */
    DateUtil.parseDateTimeParts = function (dateParts, timeParts) {
        dateParts = dateParts.map(DateUtil.parseNumber);
        timeParts = timeParts.map(DateUtil.parseNumber);
        var year = dateParts[0];
        var month = dateParts[1] - 1;
        var day = dateParts[2];
        var hours = timeParts[0];
        var minutes = timeParts[1];
        var seconds = timeParts[2];
        var date = Date.UTC(year, month, day, hours, minutes, seconds, 0);
        var timestamp = date / 1000;
        return timestamp;
    };
    /**
     * parse date with "2004-09-04T23:39:06-08:00" format,
     * one of the formats supported by ISO 8601, and
     * convert to utc timestamp in seconds
     * @param dateTimeStr
     * @returns {number}
     */
    DateUtil.parseDateWithTimezoneFormat = function (dateTimeStr) {
        var dateParts = dateTimeStr.substr(0, 10).split('-');
        var timeParts = dateTimeStr.substr(11, 8).split(':');
        var timezoneStr = dateTimeStr.substr(19, 6);
        var timezoneParts = timezoneStr.split(':').map(DateUtil.parseNumber);
        var timezoneOffset = (timezoneParts[0] * DateUtil.hours) +
            (timezoneParts[1] * DateUtil.minutes);
        var timestamp = DateUtil.parseDateTimeParts(dateParts, timeParts);
        //minus because the timezoneOffset describes
        //how much the described time is ahead of UTC
        timestamp -= timezoneOffset;
        if (typeof timestamp === 'number' && !isNaN(timestamp)) {
            return timestamp;
        }
    };
    /**
     * parse date with "YYYY:MM:DD hh:mm:ss" format, convert to utc timestamp in seconds
     * @param dateTimeStr
     * @returns {number}
     */
    DateUtil.parseDateWithSpecFormat = function (dateTimeStr) {
        var parts = dateTimeStr.split(' '), dateParts = parts[0].split(':'), timeParts = parts[1].split(':');
        var timestamp = DateUtil.parseDateTimeParts(dateParts, timeParts);
        if (typeof timestamp === 'number' && !isNaN(timestamp)) {
            return timestamp;
        }
    };
    DateUtil.parseExifDate = function (dateTimeStr) {
        //some easy checks to determine two common date formats
        //is the date in the standard "YYYY:MM:DD hh:mm:ss" format?
        var isSpecFormat = dateTimeStr.length === 19 &&
            dateTimeStr.charAt(4) === ':';
        //is the date in the non-standard format,
        //"2004-09-04T23:39:06-08:00" to include a timezone?
        var isTimezoneFormat = dateTimeStr.length === 25 &&
            dateTimeStr.charAt(10) === 'T';
        if (isTimezoneFormat) {
            return DateUtil.parseDateWithTimezoneFormat(dateTimeStr);
        }
        else if (isSpecFormat) {
            return DateUtil.parseDateWithSpecFormat(dateTimeStr);
        }
    };
    //in seconds
    DateUtil.hours = 3600;
    DateUtil.minutes = 60;
    return DateUtil;
}());
DateUtil$1.DateUtil = DateUtil;

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.simplify = void 0;
	var ExifSectionParser_1 = ExifSectionParser;
	var DateUtil_1 = DateUtil$1;
	(function (simplify) {
	    var degreeTags = [{
	            section: ExifSectionParser_1.ExifSections.GPSIFD,
	            type: 0x0002,
	            name: 'GPSLatitude',
	            refType: 0x0001,
	            refName: 'GPSLatitudeRef',
	            posVal: 'N'
	        },
	        {
	            section: ExifSectionParser_1.ExifSections.GPSIFD,
	            type: 0x0004,
	            name: 'GPSLongitude',
	            refType: 0x0003,
	            refName: 'GPSLongitudeRef',
	            posVal: 'E'
	        }];
	    var dateTags = [{
	            section: ExifSectionParser_1.ExifSections.SubIFD,
	            type: 0x0132,
	            name: 'ModifyDate'
	        },
	        {
	            section: ExifSectionParser_1.ExifSections.SubIFD,
	            type: 0x9003,
	            name: 'DateTimeOriginal'
	        },
	        {
	            section: ExifSectionParser_1.ExifSections.SubIFD,
	            type: 0x9004,
	            name: 'CreateDate'
	        },
	        {
	            section: ExifSectionParser_1.ExifSections.SubIFD,
	            type: 0x0132,
	            name: 'ModifyDate',
	        }];
	    function castDegreeValues(getTagValue, setTagValue) {
	        degreeTags.forEach(function (t) {
	            var degreeVal = getTagValue(t);
	            if (degreeVal) {
	                var degreeRef = getTagValue({ section: t.section, type: t.refType, name: t.refName });
	                var degreeNumRef = degreeRef === t.posVal ? 1 : -1;
	                var degree = (degreeVal[0] + (degreeVal[1] / 60) + (degreeVal[2] / 3600)) * degreeNumRef;
	                setTagValue(t, degree);
	            }
	        });
	    }
	    simplify.castDegreeValues = castDegreeValues;
	    function castDateValues(getTagValue, setTagValue) {
	        dateTags.forEach(function (t) {
	            var dateStrVal = getTagValue(t);
	            if (dateStrVal) {
	                //some easy checks to determine two common date formats
	                var timestamp = DateUtil_1.DateUtil.parseExifDate(dateStrVal);
	                if (typeof timestamp !== 'undefined') {
	                    setTagValue(t, timestamp);
	                }
	            }
	        });
	    }
	    simplify.castDateValues = castDateValues;
	    function simplifyValue(values, format) {
	        if (Array.isArray(values)) {
	            values = values.map(function (value) {
	                if (format === 10 || format === 5) {
	                    return value[0] / value[1];
	                }
	                return value;
	            });
	            if (values.length === 1) {
	                values = values[0];
	            }
	        }
	        return values;
	    }
	    simplify.simplifyValue = simplifyValue;
	})(exports.simplify || (exports.simplify = {}));
	
} (simplify));

var JpegParser$1 = {};

/*jslint browser: true, devel: true, bitwise: false, debug: true, eqeq: false, es5: true, evil: false, forin: false, newcap: false, nomen: true, plusplus: true, regexp: false, unparam: false, sloppy: true, stupid: false, sub: false, todo: true, vars: true, white: true */
Object.defineProperty(JpegParser$1, "__esModule", { value: true });
JpegParser$1.JpegParser = void 0;
var JpegParser = /** @class */ (function () {
    function JpegParser() {
    }
    JpegParser.parseSections = function (stream, iterator) {
        var len, markerType;
        stream.setBigEndian(true);
        //stop reading the stream at the SOS (Start of Stream) marker,
        //because its length is not stored in the header so we can't
        //know where to jump to. The only marker after that is just EOI (End Of Image) anyway
        while (stream.remainingLength() > 0 && markerType !== 0xDA) {
            if (stream.nextUInt8() !== 0xFF) {
                return;
            }
            markerType = stream.nextUInt8();
            //don't read size from markers that have no datas
            if ((markerType >= 0xD0 && markerType <= 0xD9) || markerType === 0xDA) {
                len = 0;
            }
            else {
                len = stream.nextUInt16() - 2;
            }
            iterator(markerType, stream.branch(0, len));
            stream.skip(len);
        }
    };
    //stream should be located after SOF section size and in big endian mode, like passed to parseSections iterator
    JpegParser.getSizeFromSOFSection = function (stream) {
        stream.skip(1);
        return {
            height: stream.nextUInt16(),
            width: stream.nextUInt16()
        };
    };
    JpegParser.getSectionName = function (markerType) {
        var name, index;
        switch (markerType) {
            case 0xD8:
                name = 'SOI';
                break;
            case 0xC4:
                name = 'DHT';
                break;
            case 0xDB:
                name = 'DQT';
                break;
            case 0xDD:
                name = 'DRI';
                break;
            case 0xDA:
                name = 'SOS';
                break;
            case 0xFE:
                name = 'COM';
                break;
            case 0xD9:
                name = 'EOI';
                break;
            default:
                if (markerType >= 0xE0 && markerType <= 0xEF) {
                    name = 'APP';
                    index = markerType - 0xE0;
                }
                else if (markerType >= 0xC0 && markerType <= 0xCF && markerType !== 0xC4 && markerType !== 0xC8 && markerType !== 0xCC) {
                    name = 'SOF';
                    index = markerType - 0xC0;
                }
                else if (markerType >= 0xD0 && markerType <= 0xD7) {
                    name = 'RST';
                    index = markerType - 0xD0;
                }
                break;
        }
        var nameStruct = {
            name: name
        };
        if (typeof index === 'number') {
            nameStruct.index = index;
        }
        return nameStruct;
    };
    return JpegParser;
}());
JpegParser$1.JpegParser = JpegParser;

var exifTags = {};

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Tags = void 0;
	(function (Tags) {
	    Tags.Exif = {
	        0x0001: "InteropIndex",
	        0x0002: "InteropVersion",
	        0x000B: "ProcessingSoftware",
	        0x00FE: "SubfileType",
	        0x00FF: "OldSubfileType",
	        0x0100: "ImageWidth",
	        0x0101: "ImageHeight",
	        0x0102: "BitsPerSample",
	        0x0103: "Compression",
	        0x0106: "PhotometricInterpretation",
	        0x0107: "Thresholding",
	        0x0108: "CellWidth",
	        0x0109: "CellLength",
	        0x010A: "FillOrder",
	        0x010D: "DocumentName",
	        0x010E: "ImageDescription",
	        0x010F: "Make",
	        0x0110: "Model",
	        0x0111: "StripOffsets",
	        0x0112: "Orientation",
	        0x0115: "SamplesPerPixel",
	        0x0116: "RowsPerStrip",
	        0x0117: "StripByteCounts",
	        0x0118: "MinSampleValue",
	        0x0119: "MaxSampleValue",
	        0x011A: "XResolution",
	        0x011B: "YResolution",
	        0x011C: "PlanarConfiguration",
	        0x011D: "PageName",
	        0x011E: "XPosition",
	        0x011F: "YPosition",
	        0x0120: "FreeOffsets",
	        0x0121: "FreeByteCounts",
	        0x0122: "GrayResponseUnit",
	        0x0123: "GrayResponseCurve",
	        0x0124: "T4Options",
	        0x0125: "T6Options",
	        0x0128: "ResolutionUnit",
	        0x0129: "PageNumber",
	        0x012C: "ColorResponseUnit",
	        0x012D: "TransferFunction",
	        0x0131: "Software",
	        0x0132: "ModifyDate",
	        0x013B: "Artist",
	        0x013C: "HostComputer",
	        0x013D: "Predictor",
	        0x013E: "WhitePoint",
	        0x013F: "PrimaryChromaticities",
	        0x0140: "ColorMap",
	        0x0141: "HalftoneHints",
	        0x0142: "TileWidth",
	        0x0143: "TileLength",
	        0x0144: "TileOffsets",
	        0x0145: "TileByteCounts",
	        0x0146: "BadFaxLines",
	        0x0147: "CleanFaxData",
	        0x0148: "ConsecutiveBadFaxLines",
	        0x014A: "SubIFD",
	        0x014C: "InkSet",
	        0x014D: "InkNames",
	        0x014E: "NumberofInks",
	        0x0150: "DotRange",
	        0x0151: "TargetPrinter",
	        0x0152: "ExtraSamples",
	        0x0153: "SampleFormat",
	        0x0154: "SMinSampleValue",
	        0x0155: "SMaxSampleValue",
	        0x0156: "TransferRange",
	        0x0157: "ClipPath",
	        0x0158: "XClipPathUnits",
	        0x0159: "YClipPathUnits",
	        0x015A: "Indexed",
	        0x015B: "JPEGTables",
	        0x015F: "OPIProxy",
	        0x0190: "GlobalParametersIFD",
	        0x0191: "ProfileType",
	        0x0192: "FaxProfile",
	        0x0193: "CodingMethods",
	        0x0194: "VersionYear",
	        0x0195: "ModeNumber",
	        0x01B1: "Decode",
	        0x01B2: "DefaultImageColor",
	        0x01B3: "T82Options",
	        0x01B5: "JPEGTables",
	        0x0200: "JPEGProc",
	        0x0201: "ThumbnailOffset",
	        0x0202: "ThumbnailLength",
	        0x0203: "JPEGRestartInterval",
	        0x0205: "JPEGLosslessPredictors",
	        0x0206: "JPEGPointTransforms",
	        0x0207: "JPEGQTables",
	        0x0208: "JPEGDCTables",
	        0x0209: "JPEGACTables",
	        0x0211: "YCbCrCoefficients",
	        0x0212: "YCbCrSubSampling",
	        0x0213: "YCbCrPositioning",
	        0x0214: "ReferenceBlackWhite",
	        0x022F: "StripRowCounts",
	        0x02BC: "ApplicationNotes",
	        0x03E7: "USPTOMiscellaneous",
	        0x1000: "RelatedImageFileFormat",
	        0x1001: "RelatedImageWidth",
	        0x1002: "RelatedImageHeight",
	        0x4746: "Rating",
	        0x4747: "XP_DIP_XML",
	        0x4748: "StitchInfo",
	        0x4749: "RatingPercent",
	        0x800D: "ImageID",
	        0x80A3: "WangTag1",
	        0x80A4: "WangAnnotation",
	        0x80A5: "WangTag3",
	        0x80A6: "WangTag4",
	        0x80E3: "Matteing",
	        0x80E4: "DataType",
	        0x80E5: "ImageDepth",
	        0x80E6: "TileDepth",
	        0x827D: "Model2",
	        0x828D: "CFARepeatPatternDim",
	        0x828E: "CFAPattern2",
	        0x828F: "BatteryLevel",
	        0x8290: "KodakIFD",
	        0x8298: "Copyright",
	        0x829A: "ExposureTime",
	        0x829D: "FNumber",
	        0x82A5: "MDFileTag",
	        0x82A6: "MDScalePixel",
	        0x82A7: "MDColorTable",
	        0x82A8: "MDLabName",
	        0x82A9: "MDSampleInfo",
	        0x82AA: "MDPrepDate",
	        0x82AB: "MDPrepTime",
	        0x82AC: "MDFileUnits",
	        0x830E: "PixelScale",
	        0x8335: "AdventScale",
	        0x8336: "AdventRevision",
	        0x835C: "UIC1Tag",
	        0x835D: "UIC2Tag",
	        0x835E: "UIC3Tag",
	        0x835F: "UIC4Tag",
	        0x83BB: "IPTC-NAA",
	        0x847E: "IntergraphPacketData",
	        0x847F: "IntergraphFlagRegisters",
	        0x8480: "IntergraphMatrix",
	        0x8481: "INGRReserved",
	        0x8482: "ModelTiePoint",
	        0x84E0: "Site",
	        0x84E1: "ColorSequence",
	        0x84E2: "IT8Header",
	        0x84E3: "RasterPadding",
	        0x84E4: "BitsPerRunLength",
	        0x84E5: "BitsPerExtendedRunLength",
	        0x84E6: "ColorTable",
	        0x84E7: "ImageColorIndicator",
	        0x84E8: "BackgroundColorIndicator",
	        0x84E9: "ImageColorValue",
	        0x84EA: "BackgroundColorValue",
	        0x84EB: "PixelIntensityRange",
	        0x84EC: "TransparencyIndicator",
	        0x84ED: "ColorCharacterization",
	        0x84EE: "HCUsage",
	        0x84EF: "TrapIndicator",
	        0x84F0: "CMYKEquivalent",
	        0x8546: "SEMInfo",
	        0x8568: "AFCP_IPTC",
	        0x85B8: "PixelMagicJBIGOptions",
	        0x85D8: "ModelTransform",
	        0x8602: "WB_GRGBLevels",
	        0x8606: "LeafData",
	        0x8649: "PhotoshopSettings",
	        0x8769: "ExifOffset",
	        0x8773: "ICC_Profile",
	        0x877F: "TIFF_FXExtensions",
	        0x8780: "MultiProfiles",
	        0x8781: "SharedData",
	        0x8782: "T88Options",
	        0x87AC: "ImageLayer",
	        0x87AF: "GeoTiffDirectory",
	        0x87B0: "GeoTiffDoubleParams",
	        0x87B1: "GeoTiffAsciiParams",
	        0x8822: "ExposureProgram",
	        0x8824: "SpectralSensitivity",
	        0x8825: "GPSInfo",
	        0x8827: "ISO",
	        0x8828: "Opto-ElectricConvFactor",
	        0x8829: "Interlace",
	        0x882A: "TimeZoneOffset",
	        0x882B: "SelfTimerMode",
	        0x8830: "SensitivityType",
	        0x8831: "StandardOutputSensitivity",
	        0x8832: "RecommendedExposureIndex",
	        0x8833: "ISOSpeed",
	        0x8834: "ISOSpeedLatitudeyyy",
	        0x8835: "ISOSpeedLatitudezzz",
	        0x885C: "FaxRecvParams",
	        0x885D: "FaxSubAddress",
	        0x885E: "FaxRecvTime",
	        0x888A: "LeafSubIFD",
	        0x9000: "ExifVersion",
	        0x9003: "DateTimeOriginal",
	        0x9004: "CreateDate",
	        0x9101: "ComponentsConfiguration",
	        0x9102: "CompressedBitsPerPixel",
	        0x9201: "ShutterSpeedValue",
	        0x9202: "ApertureValue",
	        0x9203: "BrightnessValue",
	        0x9204: "ExposureCompensation",
	        0x9205: "MaxApertureValue",
	        0x9206: "SubjectDistance",
	        0x9207: "MeteringMode",
	        0x9208: "LightSource",
	        0x9209: "Flash",
	        0x920A: "FocalLength",
	        0x920B: "FlashEnergy",
	        0x920C: "SpatialFrequencyResponse",
	        0x920D: "Noise",
	        0x920E: "FocalPlaneXResolution",
	        0x920F: "FocalPlaneYResolution",
	        0x9210: "FocalPlaneResolutionUnit",
	        0x9211: "ImageNumber",
	        0x9212: "SecurityClassification",
	        0x9213: "ImageHistory",
	        0x9214: "SubjectArea",
	        0x9215: "ExposureIndex",
	        0x9216: "TIFF-EPStandardID",
	        0x9217: "SensingMethod",
	        0x923A: "CIP3DataFile",
	        0x923B: "CIP3Sheet",
	        0x923C: "CIP3Side",
	        0x923F: "StoNits",
	        0x927C: "MakerNote",
	        0x9286: "UserComment",
	        0x9290: "SubSecTime",
	        0x9291: "SubSecTimeOriginal",
	        0x9292: "SubSecTimeDigitized",
	        0x932F: "MSDocumentText",
	        0x9330: "MSPropertySetStorage",
	        0x9331: "MSDocumentTextPosition",
	        0x935C: "ImageSourceData",
	        0x9C9B: "XPTitle",
	        0x9C9C: "XPComment",
	        0x9C9D: "XPAuthor",
	        0x9C9E: "XPKeywords",
	        0x9C9F: "XPSubject",
	        0xA000: "FlashpixVersion",
	        0xA001: "ColorSpace",
	        0xA002: "ExifImageWidth",
	        0xA003: "ExifImageHeight",
	        0xA004: "RelatedSoundFile",
	        0xA005: "InteropOffset",
	        0xA20B: "FlashEnergy",
	        0xA20C: "SpatialFrequencyResponse",
	        0xA20D: "Noise",
	        0xA20E: "FocalPlaneXResolution",
	        0xA20F: "FocalPlaneYResolution",
	        0xA210: "FocalPlaneResolutionUnit",
	        0xA211: "ImageNumber",
	        0xA212: "SecurityClassification",
	        0xA213: "ImageHistory",
	        0xA214: "SubjectLocation",
	        0xA215: "ExposureIndex",
	        0xA216: "TIFF-EPStandardID",
	        0xA217: "SensingMethod",
	        0xA300: "FileSource",
	        0xA301: "SceneType",
	        0xA302: "CFAPattern",
	        0xA401: "CustomRendered",
	        0xA402: "ExposureMode",
	        0xA403: "WhiteBalance",
	        0xA404: "DigitalZoomRatio",
	        0xA405: "FocalLengthIn35mmFormat",
	        0xA406: "SceneCaptureType",
	        0xA407: "GainControl",
	        0xA408: "Contrast",
	        0xA409: "Saturation",
	        0xA40A: "Sharpness",
	        0xA40B: "DeviceSettingDescription",
	        0xA40C: "SubjectDistanceRange",
	        0xA420: "ImageUniqueID",
	        0xA430: "OwnerName",
	        0xA431: "SerialNumber",
	        0xA432: "LensInfo",
	        0xA433: "LensMake",
	        0xA434: "LensModel",
	        0xA435: "LensSerialNumber",
	        0xA480: "GDALMetadata",
	        0xA481: "GDALNoData",
	        0xA500: "Gamma",
	        0xAFC0: "ExpandSoftware",
	        0xAFC1: "ExpandLens",
	        0xAFC2: "ExpandFilm",
	        0xAFC3: "ExpandFilterLens",
	        0xAFC4: "ExpandScanner",
	        0xAFC5: "ExpandFlashLamp",
	        0xBC01: "PixelFormat",
	        0xBC02: "Transformation",
	        0xBC03: "Uncompressed",
	        0xBC04: "ImageType",
	        0xBC80: "ImageWidth",
	        0xBC81: "ImageHeight",
	        0xBC82: "WidthResolution",
	        0xBC83: "HeightResolution",
	        0xBCC0: "ImageOffset",
	        0xBCC1: "ImageByteCount",
	        0xBCC2: "AlphaOffset",
	        0xBCC3: "AlphaByteCount",
	        0xBCC4: "ImageDataDiscard",
	        0xBCC5: "AlphaDataDiscard",
	        0xC427: "OceScanjobDesc",
	        0xC428: "OceApplicationSelector",
	        0xC429: "OceIDNumber",
	        0xC42A: "OceImageLogic",
	        0xC44F: "Annotations",
	        0xC4A5: "PrintIM",
	        0xC580: "USPTOOriginalContentType",
	        0xC612: "DNGVersion",
	        0xC613: "DNGBackwardVersion",
	        0xC614: "UniqueCameraModel",
	        0xC615: "LocalizedCameraModel",
	        0xC616: "CFAPlaneColor",
	        0xC617: "CFALayout",
	        0xC618: "LinearizationTable",
	        0xC619: "BlackLevelRepeatDim",
	        0xC61A: "BlackLevel",
	        0xC61B: "BlackLevelDeltaH",
	        0xC61C: "BlackLevelDeltaV",
	        0xC61D: "WhiteLevel",
	        0xC61E: "DefaultScale",
	        0xC61F: "DefaultCropOrigin",
	        0xC620: "DefaultCropSize",
	        0xC621: "ColorMatrix1",
	        0xC622: "ColorMatrix2",
	        0xC623: "CameraCalibration1",
	        0xC624: "CameraCalibration2",
	        0xC625: "ReductionMatrix1",
	        0xC626: "ReductionMatrix2",
	        0xC627: "AnalogBalance",
	        0xC628: "AsShotNeutral",
	        0xC629: "AsShotWhiteXY",
	        0xC62A: "BaselineExposure",
	        0xC62B: "BaselineNoise",
	        0xC62C: "BaselineSharpness",
	        0xC62D: "BayerGreenSplit",
	        0xC62E: "LinearResponseLimit",
	        0xC62F: "CameraSerialNumber",
	        0xC630: "DNGLensInfo",
	        0xC631: "ChromaBlurRadius",
	        0xC632: "AntiAliasStrength",
	        0xC633: "ShadowScale",
	        0xC634: "DNGPrivateData",
	        0xC635: "MakerNoteSafety",
	        0xC640: "RawImageSegmentation",
	        0xC65A: "CalibrationIlluminant1",
	        0xC65B: "CalibrationIlluminant2",
	        0xC65C: "BestQualityScale",
	        0xC65D: "RawDataUniqueID",
	        0xC660: "AliasLayerMetadata",
	        0xC68B: "OriginalRawFileName",
	        0xC68C: "OriginalRawFileData",
	        0xC68D: "ActiveArea",
	        0xC68E: "MaskedAreas",
	        0xC68F: "AsShotICCProfile",
	        0xC690: "AsShotPreProfileMatrix",
	        0xC691: "CurrentICCProfile",
	        0xC692: "CurrentPreProfileMatrix",
	        0xC6BF: "ColorimetricReference",
	        0xC6D2: "PanasonicTitle",
	        0xC6D3: "PanasonicTitle2",
	        0xC6F3: "CameraCalibrationSig",
	        0xC6F4: "ProfileCalibrationSig",
	        0xC6F5: "ProfileIFD",
	        0xC6F6: "AsShotProfileName",
	        0xC6F7: "NoiseReductionApplied",
	        0xC6F8: "ProfileName",
	        0xC6F9: "ProfileHueSatMapDims",
	        0xC6FA: "ProfileHueSatMapData1",
	        0xC6FB: "ProfileHueSatMapData2",
	        0xC6FC: "ProfileToneCurve",
	        0xC6FD: "ProfileEmbedPolicy",
	        0xC6FE: "ProfileCopyright",
	        0xC714: "ForwardMatrix1",
	        0xC715: "ForwardMatrix2",
	        0xC716: "PreviewApplicationName",
	        0xC717: "PreviewApplicationVersion",
	        0xC718: "PreviewSettingsName",
	        0xC719: "PreviewSettingsDigest",
	        0xC71A: "PreviewColorSpace",
	        0xC71B: "PreviewDateTime",
	        0xC71C: "RawImageDigest",
	        0xC71D: "OriginalRawFileDigest",
	        0xC71E: "SubTileBlockSize",
	        0xC71F: "RowInterleaveFactor",
	        0xC725: "ProfileLookTableDims",
	        0xC726: "ProfileLookTableData",
	        0xC740: "OpcodeList1",
	        0xC741: "OpcodeList2",
	        0xC74E: "OpcodeList3",
	        0xC761: "NoiseProfile",
	        0xC763: "TimeCodes",
	        0xC764: "FrameRate",
	        0xC772: "TStop",
	        0xC789: "ReelName",
	        0xC791: "OriginalDefaultFinalSize",
	        0xC792: "OriginalBestQualitySize",
	        0xC793: "OriginalDefaultCropSize",
	        0xC7A1: "CameraLabel",
	        0xC7A3: "ProfileHueSatMapEncoding",
	        0xC7A4: "ProfileLookTableEncoding",
	        0xC7A5: "BaselineExposureOffset",
	        0xC7A6: "DefaultBlackRender",
	        0xC7A7: "NewRawImageDigest",
	        0xC7A8: "RawToPreviewGain",
	        0xC7B5: "DefaultUserCrop",
	        0xEA1C: "Padding",
	        0xEA1D: "OffsetSchema",
	        0xFDE8: "OwnerName",
	        0xFDE9: "SerialNumber",
	        0xFDEA: "Lens",
	        0xFE00: "KDC_IFD",
	        0xFE4C: "RawFile",
	        0xFE4D: "Converter",
	        0xFE4E: "WhiteBalance",
	        0xFE51: "Exposure",
	        0xFE52: "Shadows",
	        0xFE53: "Brightness",
	        0xFE54: "Contrast",
	        0xFE55: "Saturation",
	        0xFE56: "Sharpness",
	        0xFE57: "Smoothness",
	        0xFE58: "MoireFilter"
	    };
	    Tags.GPS = {
	        0x0000: 'GPSVersionID',
	        0x0001: 'GPSLatitudeRef',
	        0x0002: 'GPSLatitude',
	        0x0003: 'GPSLongitudeRef',
	        0x0004: 'GPSLongitude',
	        0x0005: 'GPSAltitudeRef',
	        0x0006: 'GPSAltitude',
	        0x0007: 'GPSTimeStamp',
	        0x0008: 'GPSSatellites',
	        0x0009: 'GPSStatus',
	        0x000A: 'GPSMeasureMode',
	        0x000B: 'GPSDOP',
	        0x000C: 'GPSSpeedRef',
	        0x000D: 'GPSSpeed',
	        0x000E: 'GPSTrackRef',
	        0x000F: 'GPSTrack',
	        0x0010: 'GPSImgDirectionRef',
	        0x0011: 'GPSImgDirection',
	        0x0012: 'GPSMapDatum',
	        0x0013: 'GPSDestLatitudeRef',
	        0x0014: 'GPSDestLatitude',
	        0x0015: 'GPSDestLongitudeRef',
	        0x0016: 'GPSDestLongitude',
	        0x0017: 'GPSDestBearingRef',
	        0x0018: 'GPSDestBearing',
	        0x0019: 'GPSDestDistanceRef',
	        0x001A: 'GPSDestDistance',
	        0x001B: 'GPSProcessingMethod',
	        0x001C: 'GPSAreaInformation',
	        0x001D: 'GPSDateStamp',
	        0x001E: 'GPSDifferential',
	        0x001F: 'GPSHPositioningError'
	    };
	})(exports.Tags || (exports.Tags = {}));
	
} (exifTags));

var ExifData = {};

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ExifData = exports.ThumbnailTypes = exports.OrientationTypes = void 0;
	var JpegParser_1 = JpegParser$1;
	(function (OrientationTypes) {
	    OrientationTypes[OrientationTypes["TOP_LEFT"] = 1] = "TOP_LEFT";
	    OrientationTypes[OrientationTypes["TOP_RIGHT"] = 2] = "TOP_RIGHT";
	    OrientationTypes[OrientationTypes["BOTTOM_RIGHT"] = 3] = "BOTTOM_RIGHT";
	    OrientationTypes[OrientationTypes["BOTTOM_LEFT"] = 4] = "BOTTOM_LEFT";
	    OrientationTypes[OrientationTypes["LEFT_TOP"] = 5] = "LEFT_TOP";
	    OrientationTypes[OrientationTypes["RIGHT_TOP"] = 6] = "RIGHT_TOP";
	    OrientationTypes[OrientationTypes["RIGHT_BOTTOM"] = 7] = "RIGHT_BOTTOM";
	    OrientationTypes[OrientationTypes["LEFT_BOTTOM"] = 8] = "LEFT_BOTTOM";
	})(exports.OrientationTypes || (exports.OrientationTypes = {}));
	var ThumbnailTypes;
	(function (ThumbnailTypes) {
	    ThumbnailTypes[ThumbnailTypes["jpeg"] = 6] = "jpeg";
	    ThumbnailTypes[ThumbnailTypes["tiff"] = 1] = "tiff";
	})(ThumbnailTypes = exports.ThumbnailTypes || (exports.ThumbnailTypes = {}));
	var ExifData = /** @class */ (function () {
	    function ExifData(startMarker, tags, imageSize, thumbnailOffset, thumbnailLength, thumbnailType, app1Offset) {
	        this.startMarker = startMarker;
	        this.tags = tags;
	        this.imageSize = imageSize;
	        this.thumbnailOffset = thumbnailOffset;
	        this.thumbnailLength = thumbnailLength;
	        this.thumbnailType = thumbnailType;
	        this.app1Offset = app1Offset;
	    }
	    ExifData.prototype.hasThumbnail = function (mime) {
	        if (!this.thumbnailOffset || !this.thumbnailLength) {
	            return false;
	        }
	        if (typeof mime !== 'string') {
	            return true;
	        }
	        if (mime.toLowerCase().trim() === 'image/jpeg') {
	            return this.thumbnailType === ThumbnailTypes.jpeg;
	        }
	        if (mime.toLowerCase().trim() === 'image/tiff') {
	            return this.thumbnailType === ThumbnailTypes.tiff;
	        }
	        return false;
	    };
	    ExifData.prototype.getThumbnailOffset = function () {
	        return this.app1Offset + 6 + this.thumbnailOffset;
	    };
	    ExifData.prototype.getThumbnailLength = function () {
	        return this.thumbnailLength;
	    };
	    ExifData.prototype.getThumbnailBuffer = function () {
	        return this.getThumbnailStream().nextBuffer(this.thumbnailLength);
	    };
	    ExifData.prototype.getThumbnailStream = function () {
	        return this.startMarker.openWithOffset(this.getThumbnailOffset());
	    };
	    ExifData.prototype.getImageSize = function () {
	        return this.imageSize;
	    };
	    ExifData.prototype.getThumbnailSize = function () {
	        var stream = this.getThumbnailStream(), size;
	        JpegParser_1.JpegParser.parseSections(stream, function (sectionType, sectionStream) {
	            if (JpegParser_1.JpegParser.getSectionName(sectionType).name === 'SOF') {
	                size = JpegParser_1.JpegParser.getSizeFromSOFSection(sectionStream);
	            }
	        });
	        return size;
	    };
	    return ExifData;
	}());
	exports.ExifData = ExifData;
	
} (ExifData));

Object.defineProperty(ExifParser$1, "__esModule", { value: true });
ExifParser$1.ExifParser = void 0;
/*jslint browser: true, devel: true, bitwise: false, debug: true, eqeq: false, es5: true, evil: false, forin: false, newcap: false, nomen: true, plusplus: true, regexp: false, unparam: false, sloppy: true, stupid: false, sub: false, todo: true, lets: true, white: true */
var simplify_1 = simplify;
var JpegParser_1 = JpegParser$1;
var ExifSectionParser_1 = ExifSectionParser;
var exif_tags_1 = exifTags;
var ExifData_1 = ExifData;
var ExifParser = /** @class */ (function () {
    function ExifParser(stream) {
        this.stream = stream;
        this.flags = {
            readBinaryTags: false,
            resolveTagNames: true,
            simplifyValues: true,
            imageSize: true,
            hidePointers: true,
            returnTags: true
        };
    }
    ExifParser.prototype.enableBinaryFields = function (enable) {
        this.flags.readBinaryTags = enable;
        return this;
    };
    ExifParser.prototype.enablePointers = function (enable) {
        this.flags.hidePointers = !enable;
        return this;
    };
    ExifParser.prototype.enableTagNames = function (enable) {
        this.flags.resolveTagNames = enable;
        return this;
    };
    ExifParser.prototype.enableImageSize = function (enable) {
        this.flags.imageSize = enable;
        return this;
    };
    ExifParser.prototype.enableReturnTags = function (enable) {
        this.flags.returnTags = enable;
        return this;
    };
    ExifParser.prototype.enableSimpleValues = function (enable) {
        this.flags.simplifyValues = enable;
        return this;
    };
    ExifParser.prototype.parse = function () {
        var start = this.stream.mark(), stream = start.openWithOffset(0), flags = this.flags, tags, imageSize, thumbnailOffset, thumbnailLength, thumbnailType, app1Offset, getTagValue, setTagValue;
        if (flags.resolveTagNames) {
            tags = {};
            getTagValue = function (t) {
                return tags[t.name];
            };
            setTagValue = function (t, value) {
                tags[t.name] = value;
            };
        }
        else {
            tags = [];
            getTagValue = function (t) {
                var i;
                for (i = 0; i < tags.length; ++i) {
                    if (tags[i].type === t.type && tags[i].section === t.section) {
                        return tags.value;
                    }
                }
            };
            setTagValue = function (t, value) {
                var i;
                for (i = 0; i < tags.length; ++i) {
                    if (tags[i].type === t.type && tags[i].section === t.section) {
                        tags.value = value;
                        return;
                    }
                }
            };
        }
        JpegParser_1.JpegParser.parseSections(stream, function (sectionType, sectionStream) {
            var validExifHeaders, sectionOffset = sectionStream.offsetFrom(start);
            if (sectionType === 0xE1) {
                validExifHeaders = ExifSectionParser_1.ExifSectionParser.parseTags(sectionStream, function (ifdSection, tagType, value, format) {
                    //ignore binary fields if disabled
                    if (!flags.readBinaryTags && format === 7) {
                        return;
                    }
                    if (tagType === 0x0201) {
                        thumbnailOffset = value[0];
                        if (flags.hidePointers) {
                            return;
                        }
                    }
                    else if (tagType === 0x0202) {
                        thumbnailLength = value[0];
                        if (flags.hidePointers) {
                            return;
                        }
                    }
                    else if (tagType === 0x0103) {
                        thumbnailType = value[0];
                        if (flags.hidePointers) {
                            return;
                        }
                    }
                    //if flag is set to not store tags, return here after storing pointers
                    if (!flags.returnTags) {
                        return;
                    }
                    if (flags.simplifyValues) {
                        value = simplify_1.simplify.simplifyValue(value, format);
                    }
                    if (flags.resolveTagNames) {
                        var sectionTagNames = ifdSection === ExifSectionParser_1.ExifSections.GPSIFD ? exif_tags_1.Tags.GPS : exif_tags_1.Tags.Exif;
                        var name_1 = sectionTagNames[tagType];
                        if (!name_1) {
                            name_1 = exif_tags_1.Tags.Exif[tagType];
                        }
                        if (!tags.hasOwnProperty(name_1)) {
                            tags[name_1] = value;
                        }
                    }
                    else {
                        tags.push({
                            section: ifdSection,
                            type: tagType,
                            value: value
                        });
                    }
                });
                if (validExifHeaders) {
                    app1Offset = sectionOffset;
                }
            }
            else if (flags.imageSize && JpegParser_1.JpegParser.getSectionName(sectionType).name === 'SOF') {
                imageSize = JpegParser_1.JpegParser.getSizeFromSOFSection(sectionStream);
            }
        });
        if (flags.simplifyValues) {
            simplify_1.simplify.castDegreeValues(getTagValue, setTagValue);
            simplify_1.simplify.castDateValues(getTagValue, setTagValue);
        }
        return new ExifData_1.ExifData(start, tags, imageSize, thumbnailOffset, thumbnailLength, thumbnailType, app1Offset);
    };
    return ExifParser;
}());
ExifParser$1.ExifParser = ExifParser;

var DOMBufferStream = {};

var hasRequiredDOMBufferStream;

function requireDOMBufferStream () {
	if (hasRequiredDOMBufferStream) return DOMBufferStream;
	hasRequiredDOMBufferStream = 1;
	/*jslint browser: true, devel: true, bitwise: false, debug: true, eqeq: false, es5: true, evil: false, forin: false, newcap: false, nomen: true, plusplus: true, regexp: false, unparam: false, sloppy: true, stupid: false, sub: false, todo: true, lets: true, white: true */
	Object.defineProperty(DOMBufferStream, "__esModule", { value: true });
	DOMBufferStream.DOMBufferStream = void 0;
	var DOMBufferStream$1 = /** @class */ (function () {
	    function DOMBufferStream(arrayBuffer, offset, length, bigEndian, global, parentOffset) {
	        this.arrayBuffer = arrayBuffer;
	        this.offset = offset;
	        this.length = length;
	        this.bigEndian = bigEndian;
	        this.global = global;
	        this.parentOffset = parentOffset;
	        this.global = global;
	        offset = offset || 0;
	        length = length || (arrayBuffer.byteLength - offset);
	        this.arrayBuffer = arrayBuffer.slice(offset, offset + length);
	        this.view = new global.DataView(this.arrayBuffer, 0, this.arrayBuffer.byteLength);
	        this.setBigEndian(bigEndian);
	        this.offset = 0;
	        this.parentOffset = (parentOffset || 0) + offset;
	    }
	    DOMBufferStream.prototype.setBigEndian = function (bigEndian) {
	        this.littleEndian = !bigEndian;
	    };
	    DOMBufferStream.prototype.nextUInt8 = function () {
	        var value = this.view.getUint8(this.offset);
	        this.offset += 1;
	        return value;
	    };
	    DOMBufferStream.prototype.nextInt8 = function () {
	        var value = this.view.getInt8(this.offset);
	        this.offset += 1;
	        return value;
	    };
	    DOMBufferStream.prototype.nextUInt16 = function () {
	        var value = this.view.getUint16(this.offset, this.littleEndian);
	        this.offset += 2;
	        return value;
	    };
	    DOMBufferStream.prototype.nextUInt32 = function () {
	        var value = this.view.getUint32(this.offset, this.littleEndian);
	        this.offset += 4;
	        return value;
	    };
	    DOMBufferStream.prototype.nextInt16 = function () {
	        var value = this.view.getInt16(this.offset, this.littleEndian);
	        this.offset += 2;
	        return value;
	    };
	    DOMBufferStream.prototype.nextInt32 = function () {
	        var value = this.view.getInt32(this.offset, this.littleEndian);
	        this.offset += 4;
	        return value;
	    };
	    DOMBufferStream.prototype.nextFloat = function () {
	        var value = this.view.getFloat32(this.offset, this.littleEndian);
	        this.offset += 4;
	        return value;
	    };
	    DOMBufferStream.prototype.nextDouble = function () {
	        var value = this.view.getFloat64(this.offset, this.littleEndian);
	        this.offset += 8;
	        return value;
	    };
	    DOMBufferStream.prototype.nextBuffer = function (length) {
	        //this won't work in IE10
	        var value = this.arrayBuffer.slice(this.offset, this.offset + length);
	        this.offset += length;
	        return value;
	    };
	    DOMBufferStream.prototype.remainingLength = function () {
	        return this.arrayBuffer.byteLength - this.offset;
	    };
	    DOMBufferStream.prototype.nextString = function (length) {
	        var value = this.arrayBuffer.slice(this.offset, this.offset + length);
	        value = String.fromCharCode.apply(null, new this.global.Uint8Array(value));
	        this.offset += length;
	        return value;
	    };
	    DOMBufferStream.prototype.mark = function () {
	        var self = this;
	        return {
	            openWithOffset: function (offset) {
	                offset = (offset || 0) + this.offset;
	                return new DOMBufferStream(self.arrayBuffer, offset, self.arrayBuffer.byteLength - offset, !self.littleEndian, self.global, self.parentOffset);
	            },
	            offset: this.offset,
	            getParentOffset: function () {
	                return self.parentOffset;
	            }
	        };
	    };
	    DOMBufferStream.prototype.offsetFrom = function (marker) {
	        return this.parentOffset + this.offset - (marker.offset + marker.getParentOffset());
	    };
	    DOMBufferStream.prototype.skip = function (amount) {
	        this.offset += amount;
	    };
	    DOMBufferStream.prototype.branch = function (offset, length) {
	        length = typeof length === 'number' ? length : this.arrayBuffer.byteLength - (this.offset + offset);
	        return new DOMBufferStream(this.arrayBuffer, this.offset + offset, length, !this.littleEndian, this.global, this.parentOffset);
	    };
	    return DOMBufferStream;
	}());
	DOMBufferStream.DOMBufferStream = DOMBufferStream$1;
	
	return DOMBufferStream;
}

var BufferStream = {};

var hasRequiredBufferStream;

function requireBufferStream () {
	if (hasRequiredBufferStream) return BufferStream;
	hasRequiredBufferStream = 1;
	Object.defineProperty(BufferStream, "__esModule", { value: true });
	BufferStream.BufferStream = void 0;
	var BufferStream$1 = /** @class */ (function () {
	    function BufferStream(buffer, offset, length, bigEndian) {
	        if (offset === void 0) { offset = 0; }
	        if (length === void 0) { length = buffer.length; }
	        this.buffer = buffer;
	        this.offset = offset;
	        this.length = length;
	        this.bigEndian = bigEndian;
	        this.endPosition = this.offset + length;
	        this.setBigEndian(bigEndian);
	    }
	    BufferStream.prototype.setBigEndian = function (bigEndian) {
	        this.bigEndian = !!bigEndian;
	    };
	    BufferStream.prototype.nextUInt8 = function () {
	        var value = this.buffer.readUInt8(this.offset);
	        this.offset += 1;
	        return value;
	    };
	    BufferStream.prototype.nextInt8 = function () {
	        var value = this.buffer.readInt8(this.offset);
	        this.offset += 1;
	        return value;
	    };
	    BufferStream.prototype.nextUInt16 = function () {
	        var value = this.bigEndian ? this.buffer.readUInt16BE(this.offset) : this.buffer.readUInt16LE(this.offset);
	        this.offset += 2;
	        return value;
	    };
	    BufferStream.prototype.nextUInt32 = function () {
	        var value = this.bigEndian ? this.buffer.readUInt32BE(this.offset) : this.buffer.readUInt32LE(this.offset);
	        this.offset += 4;
	        return value;
	    };
	    BufferStream.prototype.nextInt16 = function () {
	        var value = this.bigEndian ? this.buffer.readInt16BE(this.offset) : this.buffer.readInt16LE(this.offset);
	        this.offset += 2;
	        return value;
	    };
	    BufferStream.prototype.nextInt32 = function () {
	        var value = this.bigEndian ? this.buffer.readInt32BE(this.offset) : this.buffer.readInt32LE(this.offset);
	        this.offset += 4;
	        return value;
	    };
	    BufferStream.prototype.nextFloat = function () {
	        var value = this.bigEndian ? this.buffer.readFloatBE(this.offset) : this.buffer.readFloatLE(this.offset);
	        this.offset += 4;
	        return value;
	    };
	    BufferStream.prototype.nextDouble = function () {
	        var value = this.bigEndian ? this.buffer.readDoubleBE(this.offset) : this.buffer.readDoubleLE(this.offset);
	        this.offset += 8;
	        return value;
	    };
	    BufferStream.prototype.nextBuffer = function (length) {
	        var value = this.buffer.slice(this.offset, this.offset + length);
	        this.offset += length;
	        return value;
	    };
	    BufferStream.prototype.remainingLength = function () {
	        return this.endPosition - this.offset;
	    };
	    BufferStream.prototype.nextString = function (length) {
	        var value = this.buffer.toString('utf8', this.offset, this.offset + length);
	        this.offset += length;
	        return value;
	    };
	    BufferStream.prototype.mark = function () {
	        var self = this;
	        return {
	            openWithOffset: function (offset) {
	                offset = (offset || 0) + this.offset;
	                return new BufferStream(self.buffer, offset, self.endPosition - offset, self.bigEndian);
	            },
	            offset: this.offset
	        };
	    };
	    BufferStream.prototype.offsetFrom = function (marker) {
	        return this.offset - marker.offset;
	    };
	    BufferStream.prototype.skip = function (amount) {
	        this.offset += amount;
	    };
	    BufferStream.prototype.branch = function (offset, length) {
	        length = typeof length === 'number' ? length : this.endPosition - (this.offset + offset);
	        return new BufferStream(this.buffer, this.offset + offset, length, this.bigEndian);
	    };
	    return BufferStream;
	}());
	BufferStream.BufferStream = BufferStream$1;
	
	return BufferStream;
}

Object.defineProperty(ExifParserFactory$1, "__esModule", { value: true });
ExifParserFactory$1.ExifParserFactory = void 0;
var ExifParser_1 = ExifParser$1;
function getGlobal() {
    return (0, eval)('this');
}
var ExifParserFactory = /** @class */ (function () {
    function ExifParserFactory() {
    }
    ExifParserFactory.create = function (buffer, global) {
        global = global || getGlobal();
        if (buffer instanceof global.ArrayBuffer) {
            var DOMBufferStream = requireDOMBufferStream().DOMBufferStream;
            return new ExifParser_1.ExifParser(new DOMBufferStream(buffer, 0, buffer.byteLength, true, global));
        }
        else {
            var NodeBufferStream = requireBufferStream().BufferStream;
            return new ExifParser_1.ExifParser(new NodeBufferStream(buffer, 0, buffer.length, true));
        }
    };
    return ExifParserFactory;
}());
ExifParserFactory$1.ExifParserFactory = ExifParserFactory;

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ThumbnailTypes = exports.ExifData = exports.OrientationTypes = exports.ExifParserFactory = void 0;
	var ExifParserFactory_1 = ExifParserFactory$1;
	Object.defineProperty(exports, "ExifParserFactory", { enumerable: true, get: function () { return ExifParserFactory_1.ExifParserFactory; } });
	var ExifData_1 = ExifData;
	Object.defineProperty(exports, "OrientationTypes", { enumerable: true, get: function () { return ExifData_1.OrientationTypes; } });
	Object.defineProperty(exports, "ExifData", { enumerable: true, get: function () { return ExifData_1.ExifData; } });
	Object.defineProperty(exports, "ThumbnailTypes", { enumerable: true, get: function () { return ExifData_1.ThumbnailTypes; } });
	
} (tsExifParser));

const EXTRACTOR_PIXELS_DEFAULT = 64e3;
const EXTRACTOR_DISTANCE_DEFAULT = 0.22;
const AVERAGE_HUE_DEFAULT = 1 / 12;
const AVERAGE_SATURATION_DEFAULT = 1 / 5;
const AVERAGE_LIGHTNESS_DEFAULT = 1 / 5;
function testInputs({
  pixels = EXTRACTOR_PIXELS_DEFAULT,
  distance: distance2 = EXTRACTOR_DISTANCE_DEFAULT,
  colorValidator = (_red, _green, _blue, _alpha) => (_alpha ?? 255) > 250,
  hueDistance: hueDistance2 = AVERAGE_HUE_DEFAULT,
  saturationDistance = AVERAGE_LIGHTNESS_DEFAULT,
  lightnessDistance = AVERAGE_SATURATION_DEFAULT,
  crossOrigin = "",
  requestMode = "cors"
} = {}) {
  const testUint = (label, val, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    if (!Number.isInteger(val)) {
      throw new Error(`${label} is not a valid number (${val})`);
    }
    if (val < min) {
      console.warn(`${label} can not be less than ${min} (it's ${val})`);
    }
    if (val > max) {
      console.warn(`${label} can not be more than ${max} (it's ${val})`);
    }
    return Math.min(Math.max(val, min), max);
  };
  const testNumber = (label, val, min = 0, max = Number.MAX_VALUE) => {
    if (Number(val) !== val) {
      throw new Error(`${label} is not a valid number (${val})`);
    }
    if (val < min) {
      console.warn(`${label} can not be less than ${min} (it's ${val})`);
    }
    if (val > max) {
      console.warn(`${label} can not be more than ${max} (it's ${val})`);
    }
    return Math.min(Math.max(val, min), max);
  };
  const testFunction = (label, val) => {
    if (!val || {}.toString.call(val) !== "[object Function]") {
      throw new Error(`${label} is not a function (${val})`);
    }
    return val;
  };
  const testValueInList = (label, val, list) => {
    if (list.indexOf(val) < 0) {
      console.warn(
        `${label} can be one of this values ${list.map((v) => `"${v}"`).join(", ")} (it's "${val}")`
      );
    }
  };
  testUint("pixels", pixels || 0, 1);
  testNumber("distance", distance2, 0, 1);
  testFunction("colorValidator", colorValidator);
  testNumber("hueDistance", hueDistance2, 0, 1);
  testNumber("saturationDistance", saturationDistance, 0, 1);
  testNumber("lightnessDistance", lightnessDistance, 0, 1);
  testValueInList("crossOrigin", crossOrigin, [
    "",
    "anonymous",
    "use-credentials"
  ]);
  testValueInList("requestMode", requestMode, [
    "cors",
    "navigate",
    "no-cors",
    "same-origin"
  ]);
}
const cleanInputs = ({
  pixels = EXTRACTOR_PIXELS_DEFAULT,
  distance: distance2 = EXTRACTOR_DISTANCE_DEFAULT,
  colorValidator = (_red, _green, _blue, _alpha) => (_alpha ?? 255) > 250,
  hueDistance: hueDistance2 = AVERAGE_HUE_DEFAULT,
  saturationDistance = AVERAGE_LIGHTNESS_DEFAULT,
  lightnessDistance = AVERAGE_SATURATION_DEFAULT,
  crossOrigin = "",
  requestMode = "cors"
} = {}) => {
  return [
    Math.max(pixels, 1),
    Math.min(Math.max(distance2, 0), 1),
    colorValidator,
    Math.min(Math.max(hueDistance2, 0), 1),
    Math.min(Math.max(saturationDistance, 0), 1),
    Math.min(Math.max(lightnessDistance, 0), 1),
    crossOrigin,
    requestMode
  ];
};
class Color {
  /**
   * Set red, green and blue colors to create the Color object.
   */
  constructor(red, green, blue, hex = red << 16 | green << 8 | blue) {
    this._count = 1;
    this.__saturation = -1;
    this.__hue = -1;
    this.__lightness = -1;
    this.__intensity = -1;
    this._red = red;
    this._green = green;
    this._blue = blue;
    this._hex = hex;
  }
  /**
   * Distance between two colors.
   * - Minimum is 0 (between two same colors)
   * - Maximum is 1 (for example between black and white)
   */
  static distance(colorA, colorB) {
    return (Math.abs(colorB._red - colorA._red) + Math.abs(colorB._green - colorA._green) + Math.abs(colorB._blue - colorA._blue)) / (3 * 255);
  }
  clone() {
    const color = new Color(this._red, this._green, this._blue, this._hex);
    color._count = this._count;
    return color;
  }
  updateHSL() {
    const red = this._red / 255;
    const green = this._green / 255;
    const blue = this._blue / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    this.__lightness = (max + min) / 2;
    if (max === min) {
      this.__hue = 0;
      this.__saturation = 0;
      this.__intensity = 0;
    } else {
      const distance2 = max - min;
      this.__saturation = this.__lightness > 0.5 ? distance2 / (2 - max - min) : distance2 / (max + min);
      this.__intensity = this.__saturation * ((0.5 - Math.abs(0.5 - this.__lightness)) * 2);
      switch (max) {
        case red:
          this.__hue = ((green - blue) / distance2 + (green < blue ? 6 : 0)) / 6;
          break;
        case green:
          this.__hue = ((blue - red) / distance2 + 2) / 6;
          break;
        case blue:
          this.__hue = ((red - green) / distance2 + 4) / 6;
          break;
      }
    }
  }
  /**
   * Hue from 0 to 1
   */
  get _hue() {
    if (this.__hue === -1) {
      this.updateHSL();
    }
    return this.__hue;
  }
  /**
   * Saturation from 0 to 1
   */
  get _saturation() {
    if (this.__saturation === -1) {
      this.updateHSL();
    }
    return this.__saturation;
  }
  /**
   * Lightness from 0 to 1
   */
  get _lightness() {
    if (this.__lightness === -1) {
      this.updateHSL();
    }
    return this.__lightness;
  }
  /**
   * Color intensity from 0 to 1
   */
  get _intensity() {
    if (this.__intensity === -1) {
      this.updateHSL();
    }
    return this.__intensity;
  }
}
class LeafGroup {
  /**
   * Store colors or groups and _count similiar groups in the image.
   */
  constructor() {
    this._count = 0;
    this._children = {};
  }
  /**
   * Add color to the group.
   *
   * @param _hex Hexadecimal value of the color
   * @param _red Red chanel amount of the color
   * @param _green Green chanel amount of the color
   * @param _blue Blue chanel amount of the color
   * @returns The color
   */
  addColor(_hex, _red, _green, _blue) {
    this._count++;
    if (this._children[_hex]) {
      this._children[_hex]._count++;
    } else {
      this._children[_hex] = new Color(_red, _green, _blue, _hex);
    }
    return this._children[_hex];
  }
  /**
   * Get list of groups of list of colors.
   *
   * @returns List of colors
   */
  getList() {
    return Object.keys(this._children).map(
      (key) => this._children[key]
    );
  }
  /**
   * Representative color of leaf.
   *
   * @returns Main color of the leaf
   */
  createMainColor() {
    const list = this.getList();
    const biggest = list.reduce((a, b) => a._count >= b._count ? a : b);
    const main = biggest.clone();
    main._count = this._count;
    return main;
  }
}
class RootGroup {
  /**
   * Store colors or groups and _count similiar groups in the image.
   */
  constructor() {
    this._count = 0;
    this._children = {};
  }
  /**
   * Get list of groups of list of colors.
   */
  getList() {
    return Object.keys(this._children).map(
      (key) => this._children[key]
    );
  }
  addColor(r, g, b) {
    const full = r << 16 | g << 8 | b;
    const loss = (r >> 4 & 15) << 8 | (g >> 4 & 15) << 4 | b >> 4 & 15;
    this._count++;
    return this.getLeafGroup(loss).addColor(full, r, g, b);
  }
  /**
   * Add a key for a color, this key is a simplification to find neighboring colors.
   * Neighboring colors has same key.
   */
  getLeafGroup(key) {
    if (!this._children[key]) {
      this._children[key] = new LeafGroup();
    }
    return this._children[key];
  }
  /**
   * List of colors sorted by importance (neighboring hare calculated by distance and removed).
   * Importance is calculated with the saturation and _count of neighboring colors.
   */
  getColors(_distance) {
    const list = this.getList().map((child) => child.createMainColor());
    list.sort((a, b) => b._count - a._count);
    const newList = [];
    while (list.length) {
      const current = list.shift();
      list.filter((color) => Color.distance(current, color) < _distance).forEach((near) => {
        current._count += near._count;
        const i = list.findIndex((color) => color === near);
        list.splice(i, 1);
      });
      newList.push(current);
    }
    return newList;
  }
}
const extractor = ({
  data,
  width,
  height
}, _pixels, _distance, _colorValidator) => {
  const colorGroup = new RootGroup();
  const reducer = width && height ? Math.floor(width * height / _pixels) || 1 : 1;
  let ignoredColorsCount = 0;
  for (let i = 0; i < data.length; i += 4 * reducer) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (_colorValidator(r, g, b, a)) {
      colorGroup.addColor(r, g, b);
    } else {
      ignoredColorsCount++;
    }
  }
  return {
    colors: colorGroup.getColors(_distance),
    count: colorGroup._count + ignoredColorsCount
  };
};
const distance = (a, b) => Math.abs(a - b);
const hueDistance = (a, b) => Math.min(distance(a, b), distance((a + 0.5) % 1, (b + 0.5) % 1));
class AverageGroup {
  constructor() {
    this.colors = [];
    this._average = null;
  }
  addColor(color) {
    this.colors.push(color);
    this._average = null;
  }
  isSamePalette(color, hue, saturation, lightness) {
    for (const currentColor of this.colors) {
      const isSame = hueDistance(currentColor._hue, color._hue) < hue && distance(currentColor._saturation, color._saturation) < saturation && distance(currentColor._lightness, color._lightness) < lightness;
      if (!isSame) {
        return false;
      }
    }
    return true;
  }
  get average() {
    if (!this._average) {
      const { r, g, b } = this.colors.reduce(
        (total2, color) => {
          total2.r += color._red;
          total2.g += color._green;
          total2.b += color._blue;
          return total2;
        },
        { r: 0, g: 0, b: 0 }
      );
      const total = this.colors.reduce(
        (_count, color) => _count + color._count,
        0
      );
      this._average = new Color(
        Math.round(r / this.colors.length),
        Math.round(g / this.colors.length),
        Math.round(b / this.colors.length)
      );
      this._average._count = total;
    }
    return this._average;
  }
}
class AverageManager {
  constructor(hue, saturation, lightness) {
    this._groups = [];
    this._hue = hue;
    this._saturation = saturation;
    this._lightness = lightness;
  }
  addColor(color) {
    const samePalette = this._groups.find(
      (averageGroup) => averageGroup.isSamePalette(
        color,
        this._hue,
        this._saturation,
        this._lightness
      )
    );
    if (samePalette) {
      samePalette.addColor(color);
    } else {
      const averageGroup = new AverageGroup();
      averageGroup.addColor(color);
      this._groups.push(averageGroup);
    }
  }
  getGroups() {
    return this._groups.map((averageGroup) => averageGroup.average);
  }
}
const sortColors = (list, _pixels, _hueDistance, _saturationDistance, _lightnessDistance) => {
  const averageManager = new AverageManager(
    _hueDistance,
    _saturationDistance,
    _lightnessDistance
  );
  list.forEach((color) => averageManager.addColor(color));
  const sorted = averageManager.getGroups();
  sorted.sort((a, b) => {
    const bPower = (b._intensity + 0.1) * (0.9 - b._count / _pixels);
    const aPower = (a._intensity + 0.1) * (0.9 - a._count / _pixels);
    return bPower - aPower;
  });
  return sorted;
};
const createFinalColor = (color, pixels) => {
  return {
    hex: `#${"0".repeat(
      6 - color._hex.toString(16).length
    )}${color._hex.toString(16)}`,
    red: color._red,
    green: color._green,
    blue: color._blue,
    area: color._count / pixels,
    hue: color._hue,
    saturation: color._saturation,
    lightness: color._lightness,
    intensity: color._intensity
  };
};
const checkIsBrowser = () => typeof window !== "undefined" && typeof window.document !== "undefined";
const checkIsWorker = () => typeof self === "object" && self.constructor && self.constructor.name === "DedicatedWorkerGlobalScope";
const checkIsNode = () => typeof window === "undefined" && // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
typeof process !== "undefined" && // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
process.versions != null && // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
process.versions.node != null;
const sortFinalColors = (_colors, _pixels, _hueDistance, _saturationDistance, _lightnessDistance) => {
  const list = sortColors(
    _colors,
    _pixels,
    _hueDistance,
    _saturationDistance,
    _lightnessDistance
  );
  return list.map((color) => createFinalColor(color, _pixels));
};
const extractImageData = (_image, _pixels) => {
  const currentPixels = _image.width * _image.height;
  const width = currentPixels < _pixels ? _image.width : Math.round(_image.width * Math.sqrt(_pixels / currentPixels));
  const height = currentPixels < _pixels ? _image.height : Math.round(_image.height * Math.sqrt(_pixels / currentPixels));
  const canvas = ((width2, height2) => {
    if (checkIsWorker()) {
      return new OffscreenCanvas(width2, height2);
    }
    const canvas2 = document.createElement("canvas");
    canvas2.width = width2;
    canvas2.height = height2;
    return canvas2;
  })(width, height);
  const context = canvas.getContext("2d");
  context.drawImage(
    _image,
    0,
    0,
    _image.width,
    _image.height,
    0,
    0,
    width,
    height
  );
  return context.getImageData(0, 0, width, height);
};
const extractColorsFromImageData = (imageData, options = {}) => {
  if (process.env.NODE_ENV !== "production") {
    testInputs(options);
  }
  const [
    _pixels,
    _distance,
    _colorValidator,
    _hueDistance,
    _saturationDistance,
    _lightnessDistance
  ] = cleanInputs(options);
  const { colors, count } = extractor(
    imageData,
    _pixels,
    _distance,
    _colorValidator
  );
  return sortFinalColors(
    colors,
    count,
    _hueDistance,
    _saturationDistance,
    _lightnessDistance
  );
};
const extractColorsFromImage = async (image, options = {}) => {
  if (checkIsNode()) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "Use extractColors instead extractColorsFromImage for Node.js"
      );
    }
    return [];
  }
  if (process.env.NODE_ENV !== "production") {
    testInputs(options);
  }
  const [
    _pixels,
    _distance,
    _colorValidator,
    _hueDistance,
    _saturationDistance,
    _lightnessDistance,
    _crossOrigin
  ] = cleanInputs(options);
  image.crossOrigin = _crossOrigin;
  return new Promise((resolve) => {
    const extract = (image2) => {
      const imageData = extractImageData(image2, _pixels);
      const { colors, count } = extractor(
        imageData,
        _pixels,
        _distance,
        _colorValidator
      );
      resolve(
        sortFinalColors(
          colors,
          count,
          _hueDistance,
          _saturationDistance,
          _lightnessDistance
        )
      );
    };
    if (image.complete) {
      extract(image);
    } else {
      const imageLoaded = () => {
        image.removeEventListener("load", imageLoaded);
        extract(image);
      };
      image.addEventListener("load", imageLoaded);
    }
  });
};
const extractColorsFromImageBitmap = async (image, options = {}) => {
  if (checkIsNode()) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "Use extractColors instead extractColorsFromImageBitmap for Node.js"
      );
    }
    return [];
  }
  if (process.env.NODE_ENV !== "production") {
    testInputs(options);
  }
  const [
    _pixels,
    _distance,
    _colorValidator,
    _hueDistance,
    _saturationDistance,
    _lightnessDistance
  ] = cleanInputs(options);
  const imageData = extractImageData(image, _pixels);
  const { colors, count } = extractor(
    imageData,
    _pixels,
    _distance,
    _colorValidator
  );
  return sortFinalColors(
    colors,
    count,
    _hueDistance,
    _saturationDistance,
    _lightnessDistance
  );
};
const extractColorsFromSrc = async (src, options = {}) => {
  if (checkIsNode()) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error("Can not use extractColorsFromSrc for Node.js");
    }
    return [];
  }
  if (process.env.NODE_ENV !== "production") {
    testInputs(options);
  }
  if (checkIsWorker()) {
    const inputs = cleanInputs(options);
    const response = await fetch(src, { mode: inputs[7] });
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const colors = await extractColorsFromImageBitmap(bitmap, options);
    bitmap.close();
    return colors;
  }
  const image = new Image();
  image.src = src;
  return extractColorsFromImage(image, options);
};
const extractColors = (picture, options) => {
  if (checkIsBrowser()) {
    if (process.env.NODE_ENV !== "production") {
      if (options == null ? void 0 : options.requestMode) {
        console.warn(
          "options.requestMode not supported in Browser, use options.crossOrigin instead"
        );
      }
    }
    if (picture instanceof Image) {
      return extractColorsFromImage(picture, options);
    }
    if (picture instanceof ImageData || picture instanceof Object && picture.data) {
      return new Promise((resolve) => {
        resolve(extractColorsFromImageData(picture, options));
      });
    }
    if (typeof picture === "string") {
      return extractColorsFromSrc(picture, options);
    }
  }
  if (checkIsWorker()) {
    if (process.env.NODE_ENV !== "production") {
      if (options == null ? void 0 : options.crossOrigin) {
        console.warn(
          "options.crossOrigin not supported in Web Worker, use options.requestMode instead"
        );
      }
    }
    if (picture instanceof ImageData || picture instanceof Object && picture.data) {
      return new Promise((resolve) => {
        resolve(
          extractColorsFromImageData(
            picture,
            options
          )
        );
      });
    }
    if (typeof picture === "string") {
      return extractColorsFromSrc(picture, options);
    }
    if (picture.src) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "HTMLImageElement not enable on worker, a fallback is used to extract src from your HTMLImageElement, please send 'src' instead HTMLImageElement"
        );
      }
      return extractColorsFromSrc(picture.src, options);
    }
  }
  if (checkIsNode()) {
    if (process.env.NODE_ENV !== "production") {
      if (picture instanceof String) {
        throw new Error(
          "Send imageData to extractColors (Image src or HTMLImageElement not supported in Nodejs)"
        );
      }
      if (!picture.data) {
        throw new Error("Send imageData to extractColors");
      }
      if (options == null ? void 0 : options.crossOrigin) {
        console.warn("options.crossOrigin not supported in Node.js");
      }
    }
    return new Promise((resolve) => {
      resolve(
        extractColorsFromImageData(picture, options)
      );
    });
  }
  throw new Error(`Can not analyse picture`);
};

var FilterType;
(function (FilterType) {
    FilterType[FilterType["NONE"] = 0] = "NONE";
    FilterType[FilterType["SIMPLE"] = 1] = "SIMPLE";
    FilterType[FilterType["CLASSIC"] = 2] = "CLASSIC";
    FilterType[FilterType["ADVANCED"] = 3] = "ADVANCED";
})(FilterType || (FilterType = {}));

const DEFAULT_HIDDEN_INFO = {
    name: false,
    path: false,
    extension: false,
    size: false,
    dimensions: false,
    date: false,
    imageTags: false,
    backlinks: false,
    infolinks: false,
    relatedFiles: false,
    colorPalette: false,
    paging: false,
    tags: true,
    palette: true,
    targetImage: true,
    start: true,
    next: true,
    prev: true
};
const DEFAULT_PLATFORM_SETTINGS = {
    filterType: FilterType.CLASSIC,
    defaultFilter: "",
    lastFilter: "",
    rightClickInfo: true,
    rightClickInfoGallery: true,
    rightClickMenu: true,
    width: 400,
    useMaxHeight: false,
    maxHeight: 400
};
const DEFAULT_SETTINGS = {
    imgDataFolder: null,
    imgmetaTemplatePath: null,
    hiddenInfoTicker: DEFAULT_HIDDEN_INFO,
    autoCompleteFields: {},
    uniqueMobileSettings: false,
    desktop: DEFAULT_PLATFORM_SETTINGS,
    mobile: DEFAULT_PLATFORM_SETTINGS,
    skipMetadataOverwrite: false,
    alternativeTags: null,
    namedFilters: []
};
const EXTRACT_COLORS_OPTIONS = {
    pixels: 20000,
    distance: 0.2,
    saturationImportance: 0.2,
    splitPower: 10,
    colorValidator: (red, green, blue, alpha = 255) => alpha > 250
};
const MIN_IMAGE_WIDTH = 100;
const EXTENSIONS = ['avif', 'png', 'jpg', 'jpeg', 'svg', 'bmp', 'webp', 'gif', 'mkv', 'mov', 'ogv', 'webm', 'mp4'];
const CONVERSION_SUPPORT = new RegExp('\\.([pP][nN][gG]|[wW][eE][bB][pP]|[jJ][pP][eE]?[gG])\\?');
const VIDEO_REGEX = new RegExp('.*\\.(mp4|webm)($|\\?)');
const DEFAULT_TEMPLATE = '---\ntags:\n---\n<%IMGEMBED%>\n<%IMGINFO%>\n%% Description %%\n';
const OB_GALLERY = 'tag-gallery';
const OB_GALLERY_INFO = 'tag-gallery-info';
const GALLERY_ICON = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="images" class="svg-inline--fa fa-images fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M480 416v16c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V176c0-26.51 21.49-48 48-48h16v208c0 44.112 35.888 80 80 80h336zm96-80V80c0-26.51-21.49-48-48-48H144c-26.51 0-48 21.49-48 48v256c0 26.51 21.49 48 48 48h384c26.51 0 48-21.49 48-48zM256 128c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-96 144l55.515-55.515c4.686-4.686 12.284-4.686 16.971 0L272 256l135.515-135.515c4.686-4.686 12.284-4.686 16.971 0L512 208v112H160v-48z"></path></svg>';
const GALLERY_SEARCH_ICON = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="search" class="svg-inline--fa fa-search fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path></svg>';
const GALLERY_LOADING_IMAGE = "data:image/gif;base64,R0lGODlhQABAAPeUMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/ACQkJCUlJSYmJicnJygoKCkpKSoqKisrKywsLC0tLS4uLi8vLzAwMDExMTIyMjMzMzQ0NDU1NTY2Njc3Nzg4ODk5OTo6Ojs7Ozw8PD09PT4+Pj8/P0BAQEFBQUJCQkNDQ0REREVFRUVGRUZGRkdHR0hISElJSUpKSktLS0xMTE1NTU5OTk5PTk9PT09QT1BQUFBRUFFRUVJSUlNTU1NUU1RUVFVVVVZWVldXV1hYV1hYWFlZWVpaWltbW1xcXF1dXV5eXl5fXl9fX2BgYGFhYWJiYmNjY2RkZGRlZGVlZWZmZmdnZ2hoaGlpaWpqampramtra2xsbG1tbW5ubm9vb3BwcHFxcHFxcXJycXJycnNzc3R0dHV1dXZ2dnZ3dnd3d3h4eHl5eXp6ent7e3x8fH19fX1+fX5+fn9/f4CAgICBgCH/C05FVFNDQVBFMi4wAwEAAAAh+QQFDQCUACwAAAAAQABAAAAI/wArCRxIsKDBgwgTKlzIsKHDhxAjCiRVy5fFi7VISdzIkOLFZ+HUiRwZ7hlGjRw5egQ5Ml6+fzBj5otH0mTGlA8psnQZs6fPnjPVlbyJM6HOcDx/Kl06cyjKogRJGUP6cqlVpvHCGXsKldOuc1WvilWa71yvTFAFWopVb6zbn/7O6Uo7MJOyd2/z/lM3CxNdgsby+RM7M6nVfvlu/S2o6Rc9rEKf7Qzb0586YGkvIcR0TB5QmiV9ZVwZ0vC/d742IdT0cJStVwg3Bavnr6lNrhMrgnTpj94ozQdX/RrlsFa4caeAG1R2zmnHWiDHIUsoC124Wg1JPYvXT10shJ1Iyf/CvZBUq+QHL/ky9y/eM/IGjb/0Z47WYoW/4g3Od7389pj9pNOKcvcJpIkp+sXkHnwDyeeTON8VKNAlv6jjE3/YJeSLhT7xI08qElaCizr9/KSOL0b9Bxc1pxQoSjuD/bQgQg7+lA84sBTISjiUydSfQdrFs9SM9wU55Hvx8UjWjwXWeCGTA214JINQGanUiQZJeSWKIVaipYlcDmTlkxmG6GRPRAp0poJIdjkmUFB+6ROWXQokZ0902skhmXWqqSSYBN0JU5puqjhnmF7uiWabdb4ZU56JLllml2vCBKmgliIaIqZ7IVppe4xK6ChMGEZlKJyTNvmnT4RGumWdnEL/queUIY6aaZI9kgrlYp+WWpCtoBJX5KmLwtdrODneB8uqqCJkqz/dgLiYJaMoWqyG1g4KC4F0WdIMOzHiqWlBZ/ZjDy917uJPuP/46uyp5xjTZyXI4MUmlX5WJY8sqvXJSS/26JrqQUH2Zl96oswirEOkqIJKQssI2SqN4aCzDHXaOFcedOGEg4lfBwlDz65G5cIKWgZZMow6tWV1G5C6UfWPObkgxMksveBbUCaW0DhPuEGFNlrM6hjWDzusJNQvTpyw4g5kJU221DgD/2XMOWMVlutP6TxcIC3ylKiXWEfLcl8qT4/91jfSppVJLWCpnbU5u3CL0yhTmSa3TFltNlUkx3qPbRtRBR5V9NZWBf0M4W4SLVLgQYkktM6FV2QRSyNJbpJFjM9rlOUXiUa556SXfl9AAAAh+QQFDACUACwDAAMAOgA6AAAI/wApCRxIsCDBSpVMGVzIsKHDh5QQSqyUDqLFiw4nTtSGsaNHSrQ0IjTl76PJh+owiawE76TLgaSMDcS1EtdLY6RMxjyXTyC8lZXwmfyX7xxOjzvz/ftHyR+qldKGEjWa82LSpVi9rfxUEiPWpUWPQrz69R8/lSK5eS07VWxDsmyNrQS1lm3YqgvhsrUH1CLbsncdKv0LdtXEjvEGE+75kDDYc7wQeqz1jKfjgaMcLqZ6Ui9WgeyOZdYMmLNLz/fwMTPlSXLjx25PG7Ns9lq0Txohwsb7klJMcu7GYQq10m+8Z7x7U/K06hVQiRbD1VJu8Plh6iatX8fu0XonVbC4f/8EikvaOPEnJ6YqRQ4fP/TpK3XK9u09fJeYXMHTd7+///8ABijggP31QiBGJW3jSiYHQgTPO75UckklDTLkDz7E9JJbhQSNU041EhbHISWnmHKKdSNGpJ1rHK5IIXrTWWQdJ6ioMhp2pDwTz0UiTYiMOOmYphxZEGlkCy7s/ONPW8npNJtiTGUkYSrosENJabF95BlEoxDT1JV2CemRJ0/+9ZAoAjk21TO1NCmlJrSZCRGUdu2IkUbpqMlYQ2WqaVEmK+3iWFgOefbVRcIA1c9fgRXa56EdbbLSNGFmyZBeH3GzUidLYtWoRXB9xM+EIuW5G1JPugTMSrMI9GlHMb0oJA9Q91AiJlK9qbKSLykSZM5KmdDSq0D84CbSsANFuB2ylOzCYkcBAQAh+QQFDQCUACwCAAIAPAA8AAAI/wApCRxIsKDBgqcqKVx46dPBhxAjSiRVy9fAZJYWLvwlsaNHgxR9PQunTp1AaBoVhuL2seXEWiPVxcv37x+lftsupbwkzqXPgyNn1hz6z5+3lJUspfvJdKBQokP9VUO6aWnTplCJGkV6CdxVrFmHakPKyd1XpmGHUsOUcpPXsz/T/iuXUSMmdHDjhs2HDKkmc3n11swXTx24XEgrIQvsc3C8cM981epksJIrxj4fP6tFCjPjzZ09Dwwt+qzNfOFqlTY9NN4z0qtdZkWtOvbHczTDqrNouyOpZ/HSuobd+2GtcLmh0i4+Ebjw18wjHk9OdHn0h7+Dh43oT2D33r7U+f/TanOgKF/l3sm7l97eO3bPYNl2Fe1dvXfv1NGzp04cMFGcjJKKLrSgosostsASICa2XRKKK7t4oootr9CSCimseKJQXRtqVFxSiYWY2IciluhhbyamWAmJKorIoog6VZJJJZ5kxMmGJG6iUScK6SQKLcb0gs0yuECjzDS8kEJZbJqgggwzzADzCzXKLAOMK6iMogw7/uiDTz76/INPPN/MYtss2lCyjz386MNPP/w1MwpBuvF23UPqPEfcnQJNt1dqfILkXFjDBVqQn7MBauhog2ZV6KIChZdWPpAShOhQlJRXqUDZYbrpQcdlutqePpEaGEXPfHoQquHMtCgnBll0wopIreZmKDi7JMaMTNRpemdfKd2VlqHcUOWNXIGCgxQm8CB7pz/RcKgQKeM4e10/4MSoUTly+crcVG2ZtFc8z46VkiblZFqdZrUx5883iZ2jLmHqQMYZn9Ig1ck3AtUb2b2BCqNtj7pECvCiqSBlCSh5BQQAIfkEBQ0AlAAsAgACADwAPAAACP8AKQkcSLCgwYK1fClcWIvUwYcQI0o0GE6dxYvhngm01anSxI8gD+b7R7JkvniUzi3jVKmlx5AwI5acWZJSPF4uXVqKybMgTZr+yqHK2VKUq55If860t4xopUvJuCHtqZSkP3WwnJIah28qVaX5qnUkSkye168/4eFymilcv7M8SZ6Ml88fP3OknMZiB5dnPHUZn1VEx+sSUUza8vWFmdFXQ1IJfZlyqmrc4pgOC25yWkmZvcuLc3IC52/qJ2HsSoOm1BIVNq+YVGFzx+/t6k7Epra8RCrXs3O0Va/umRMTJlG/xNG9N5wnZ06paC2L9qt5SM4uDYvaZB0kdqLdP2r/ApXpe8vwE2MpM0YL1Wan6D+m66fum61UmsDHB6kPHrdlu4ByHnr/EFQgQaQ8E09J/tiFjjOjcNddLeGM9FM8z0BW4U/9rCPMJ+EluOBP+YSTkDpVqeNLfL6gqJSKLYJlYnwUWkgTjC7ShGFmISr4okI5zrRjfCL+GCOJM6JHy4Y/4ZjiiujNUk4/P9ao1JDdVSKKMerUo48/JplY5EyU/FNiLeFVYsknr8iyjTpf/oPlfg8RNYot1bgjzzl0RsQZJp+koks0uPRZp3migGKoQebptKhmApr3KEGi9BJNMa9ggt2kBskDDjCujGKYS5waZFc+52zTSyqWDFjqQf68q6PNLKPsNFUo1vljzzateGWOL/m9GpE8vGjqqrAEuTOLU7YiiOai+WSTH1Gp4PJYQoIt6k88tji1iTXoBFYRXYv2481QROWCjpnx0FWTofUY4xQn1VCplKH+pOOKU6aYA+a9feITTXlEKVPPvz8ZCg4tTnniVlUH7kdLLu/lhAs8EEe8H8HFbaNPxo+22molp1wjkI0mocRpq4IKVNFFFmWE7ECRLeQYj14FBAA7";

var en = {
    // main.ts
    PLUGIN_NAME: "Gallery Tags",
    LOADED_PLUGIN_MESSAGE: "Loaded {0} Plugin",
    UNLOADING_PLUGIN_MESSAGE: 'Unloading {0} Plugin',
    // utils.ts
    MISSING_RESOURCE_WARNING: "Resource not found '{0}'",
    META_OVERWRITE_CONFLICT: "Unable to get meta file for '{0}', file exists at path '{1}' but cannot be read at this time.",
    // Standard stuff
    CONFIRM: "OK",
    CANCEL: "CANCEL",
    GENERIC_CANCELED: "Canceled",
    // Settings
    SETTING_DATA_REFRESH_TITLE: "Rebuild data cache",
    SETTING_DATA_REFRESH_DESC: "If the plugin is having issues finding certain files, you can try this.",
    SETTING_DATA_REFRESH_BUTTON: "Rebuild",
    SETTING_MAIN_PATH_TITLE: "Main gallery default path",
    SETTING_MAIN_PATH_DESC: `The path from which to show images when the main gallery is opened. 
	Setting it to '/' will show all images in the vault. 
	Can be used to avoid the loading all images and affecting on open performance 
	(especially if vault has a huge amount of high quality images). 
	Setting it to an invalid path to have no images shown when gallery is opened.`,
    SETTING_FILTER_TITLE: "Default search bar",
    SETTING_FILTER_DESC: "Which search bar to show when opening the gallery view.",
    SETTING_DEFAULT_FILTER_TITLE: "Default filter",
    SETTING_DEFAULT_FILTER_DESC: "If set, gallery view will open with the selected filter already active",
    SETTING_DEFAULT_FILTER_NONE: "None",
    LAST_USED_FILTER: "Last Used",
    SETTING_IMAGE_WIDTH_TITLE: "Default image width",
    SETTING_IMAGE_WIDTH_DESC: "Display default image width in 'pixels'. Image collumns will be no wider than this by default",
    SETTING_MAX_HEIGHT_TOGGLE_TITLE: "Use max image height",
    SETTING_MAX_HEIGHT_TOGGLE_DESC: "Toggle this option to set a max image height for images to display in collumns.",
    SETTING_MAX_HEIGHT_TITLE: "Max image height",
    SETTING_MAX_HEIGHT_DESC: "Max image height in `pixels` for images to display in collumns.",
    SETTING_METADATA_HEADER: "Image Metadata",
    SETTING_META_FOLDER_TITLE: "Gallery info folder",
    SETTING_META_FOLDER_DESC1: "Specify an existing vault folder for the gallery plugin to store image information/notes as markdown files.",
    SETTING_META_FOLDER_DESC2: "E.g. \`Resources/Gallery\`.",
    SETTING_META_FOLDER_DESC3: "On first activation the default is unspecified. Thus the info functionality of the Main gallery is diabled.",
    SETTING_META_FOLDER_DESC4: "Folder must already exist (plugin will not create it).",
    SETTING_META_FOLDER_DESC5: "If a folder is not specified no Image Information notes are created (to be used in the main gallery).",
    SETTING_META_TEMPLATE_TITLE: "Meta file template override",
    SETTING_META_TEMPLATE_DESC1: "Location of template file to use for generating image meta files. If blank will use default.",
    SETTING_META_TEMPLATE_DESC2: "These keys will be replaced with the apropriate info for the file:",
    SETTING_META_TEMPLATE_DESC3: "<% IMG LINK %> : Clickable link to the image with its name as the text",
    SETTING_META_TEMPLATE_DESC4: "<% IMG EMBED %> : Embeded view of the image",
    SETTING_META_TEMPLATE_DESC5: "<% IMG INFO %> : Info block for the image",
    SETTING_META_TEMPLATE_DESC6: "<% IMG URI %> : The formatted URI for the image that can be used to generate a link to it",
    SETTING_META_TEMPLATE_DESC7: "<% IMG PATH %> : Path to the image(including file name)",
    SETTING_META_TEMPLATE_DESC8: "<% IMG NAME %> : File name for the image",
    SETTING_QUICK_IMPORT_TITLE: "Skip Keyword import for existing keys",
    SETTING_ALTERNATIVE_TAGS_TITLE: "Alternative tags",
    SETTING_ALTERNATIVE_TAGS_DESC: "Name of frontmatter field to use for tags instead of tags. Leave blank to used tags.",
    SETTING_QUICK_IMPORT_DESC: "If this is toggled then when pulling metadata from the image file, it will be skipped if there is already an internal metadate file with keywords. This saves time on imports, but if you change the meta in the original files those changes will not be reflected.",
    SETTING_HIDDEN_INFO_TITLE: "Default hidden info",
    SETTING_HIDDEN_INFO_DESC: "When no hidden info items are specified in an image info block these info items will be hidden.",
    SETTING_HIDDEN_INFO_PLACEHOLDER: "New Hidden Field",
    SETTING_HIDDEN_INFO_ADD: "Add this field to hidden info list",
    SETTING_HIDDEN_INFO_RESET: "Reset hidden info list to defaults",
    SETTING_HIDDEN_INFO_REMOVE: "Remove from List",
    SETTING_AUTO_COMPLETE_TITLE: "Autocomplete fields",
    SETTING_AUTO_COMPLETE_DESC: "Property fields to be searched for auto complete and display in the info block like extra tag fields",
    SETTING_AUTO_COMPLETE_PLACEHOLDER: "New Autocomplete Field",
    SETTING_AUTO_COMPLETE_ADD: "Add this field to autocomplete list",
    SETTING_AUTO_COMPLETE_RESET: "Reset autocomplete list to defaults",
    SETTING_UNIQUE_MOBILE_TITLE: "Distinct settings on mobile",
    SETTING_UNIQUE_MOBILE_DESC: "Should settings in the Platform settings section be different on mobile than desktop?",
    SETTING_PLATFORM_HEADER: "Platform settings",
    SETTING_CONTEXT_INFO_TITLE: "Info panel anywhere",
    SETTING_CONTEXT_INFO_DESC: "Should right clicking on an image anywhere open the info panel?",
    SETTING_CONTEXT_MENU_TITLE: "Image menu anywhere",
    SETTING_CONTEXT_MENU_DESC: "Should right clicking on an image anywhere open the info menu?",
    SETTING_FILTER_HEADER: "User filters",
    SETTING_FILTER_REMOVE: "Remove from List",
    // Gallery View
    GALLERY_VIEW_TITLE: "Gallery View",
    FILTER_TOOLTIP: "Filter Actions",
    SEARCH_TOOLTIP: "Change Search Bar",
    INFO_TOGGLE_TOOLTIP: "Toggle the info panel",
    SORT_ORDER_TOOLTIP: "Sort Options",
    COUNT_TOOLTIP: "Number of files displayed by filter out of files the gallery could display",
    FILTER_PATH_TOOLTIP: "Folder to search",
    FILTER_PATH_PROMPT: "Path",
    FILTER_NAME_TOOLTIP: "File name contains",
    FILTER_NAME_PROMPT: "File Name",
    FILTER_TAGS_TOOLTIP: `partial tags seperated by spaces. Minus in front of a tag excludes it. eg "drawing -sketch fant" to include drawing and fantasy tags, but exclude sketches.`,
    FILTER_TAGS_PROMPT: "Tags to search",
    FILTER_MATCH_CASE_TOOLTIP: "Should tags match exact case",
    FILTER_EXCLUSIVE_TOOLTIP: "Should search include only results that match all tags?",
    FILTER_WIDTH_TOOLTIP: "Change the display width of columns",
    FILTER_RANDOM_TOOLTIP: "Randomise images",
    FILTER_RANDOM_COUNT_TOOLTIP: "number of random images to grab",
    FILTER_ADVANCED_TOOLTIP: `Build a complex filter
	---
	path: path to search in (strict)
	name: file name criteria (strict)
	regex: custom search regex (strict)
	tags: search for tags
	<front matter field>: search a custom frontmatter field
	
	Tag and frontmatter fields can also use these modifiers in front of a tag
	---
	!tag Strictly require this tag to be on the image
	-tag Strictly exclude images that have this tag
	^tag match case on this tag`,
    CANCEL_LOAD_NOTICE: "Canceled indexing, Tag search may be limited",
    BAD_REGEX_WARNING: "Gallery Search - BAD REGEX! regex set to '.*' as default!!",
    // Sort Menu
    SORT_HEADER: "Change Sorting",
    SORT_OPTION_1: "File Name",
    SORT_OPTION_2: "File Path",
    SORT_OPTION_3: "Date Added",
    SORT_OPTION_4: "Date Modified",
    SORT_OPTION_5: "File Size",
    SORT_OPTION_6: "Reverse",
    // Filter Menu
    FILTER_HEADER: "Filter Actions",
    FILTER_OPTION_1: "Copy Current Filter",
    FILTER_OPTION_2: "Filter From Clipboard",
    FILTER_OPTION_3: "Clear Filter",
    FILTER_OPTION_4: "Save Filter From Clipboard",
    FILTER_OPTION_5: "Save Filter From Current",
    FILTER_NEW_INFO: "Enter name for new filter",
    // Filter Type Menu
    FILTER_TYPE_HEADER: "Change Search Bar",
    FILTER_TYPE_OPTION_0: "Hidden",
    FILTER_TYPE_OPTION_1: "Simple Filter",
    FILTER_TYPE_OPTION_2: "Classic Filter",
    FILTER_TYPE_OPTION_3: "Advanced Filter",
    // Image Menu
    IMAGE_MENU_NOTHING: "Nothing selected",
    IMAGE_MENU_SINGLE: `"{0}" selected`,
    IMAGE_MENU_COUNT: "{0} selected",
    IMAGE_MENU_COMMAND_0: "You should never see this",
    IMAGE_MENU_COMMAND_1: "Open image file",
    IMAGE_MENU_COMMAND_2: "Open meta file",
    IMAGE_MENU_COMMAND_3: "Start Selection",
    IMAGE_MENU_COMMAND_4: "End Selection",
    IMAGE_MENU_COMMAND_5: "Select all",
    IMAGE_MENU_COMMAND_6: "Clear selection",
    IMAGE_MENU_COMMAND_7: "Copy image links",
    IMAGE_MENU_COMMAND_8: "Copy meta links",
    IMAGE_MENU_COMMAND_9: "Add tag",
    IMAGE_MENU_COMMAND_10: "Pull meta from file",
    IMAGE_MENU_COMMAND_11: "Remove tag",
    IMAGE_MENU_COMMAND_12: "Move images",
    IMAGE_MENU_COMMAND_13: "Rename",
    IMAGE_MENU_COMMAND_14: "Delete image(and meta)",
    IMAGE_MENU_COMMAND_15: "Delete just meta",
    IMAGE_MENU_COMMAND_16: "Copy image",
    IMAGE_MENU_COMMAND_17: "Share media",
    IMAGE_MENU_COMMAND_18: "Open info panel",
    IMAGE_MENU_COMMAND_19: "Copy images as filter",
    MENU_OPTION_FAULT: "context options {0} is not accounted for",
    MASS_CONTEXT_CONFIRM: "There are {0} files selected for '{1}' are you sure?",
    COPIED_MEDIA: "Media copied to clipboard",
    COPIED_LINKS: "Links copied to clipboard",
    COPIED_FILTER: "Filter copied to clipboard",
    ADDED_TAG: "Tag added to files",
    REMOVED_TAG: "Tag removed from files",
    MOVED_IMAGE: "Images moved",
    DELETED_META: "Meta deleted",
    DELETED_IMAGE: "Images and meta deleted",
    PROMPT_FOR_NEW_NAME: "Select a new name and path",
    CONFLICT_NOTICE_PATH: "ERROR: File already exists at '{0}'",
    PLATFORM_COPY_NOT_SUPPORTED: "This platform does not currently support copying videos to the clipboard",
    PLATFORM_EXEC_FAILURE: "Copy to clipboard failed, full error sent to console.",
    CAN_NOT_SHARE: "Unable to share",
    // Side Panel
    SIDE_PANEL_EDIT_TOOLTIP: "Switch to edit mode",
    SIDE_PANEL_VIEW_TOOLTIP: "Switch to view mode",
    SIDE_PANEL_SAVE_NOTICE: "Saved Changes",
    // Info Block
    IMAGE_INFO_TITLE: "Image Info",
    IMAGE_PATH_FAILED_FIND_WARNING: "### File path not found. Were you looking for one of these?\n",
    IMAGE_INFO_FIELD_NAME: "Name",
    IMAGE_INFO_FIELD_PATH: "Path",
    IMAGE_INFO_FIELD_EXTENSION: "Extension",
    IMAGE_INFO_FIELD_SIZE: "Size",
    IMAGE_INFO_FIELD_DIMENSIONS: "Dimensions",
    IMAGE_INFO_FIELD_DATE: "Date",
    IMAGE_INFO_FIELD_IMAGE_TAGS: "Image Tags",
    IMAGE_INFO_FIELD_NEW_TAG: "New Tag",
    IMAGE_INFO_FIELD_BACKLINKS: "Backlinks",
    IMAGE_INFO_FIELD_INFOLINKS: "Info Links",
    IMAGE_INFO_FIELD_RELATED: "Related Files",
    IMAGE_INFO_FIELD_PALETTE: "Color Palette",
    IMAGE_INFO_PAGING_START: "|Start|",
    IMAGE_INFO_PAGING_PREV: "<<Prev",
    IMAGE_INFO_PAGING_NEXT: "Next>>",
    // Warning instructions
    TOAST_ADDITIONAL_CONTEXT: "(click=Dismiss, right-click={0})",
    TOAST_ADDITIONAL: "(click=Dismiss)",
    CONTEXT_INFO: "Info",
    BOOTSTRAP_FAILURE: "Bootstrap process failure in {0}. Plugin may not function without restart.",
    CONTEXT_RETRY: "Restart",
    CAUSE_TAG_CACHE: "tag cache",
    CAUSE_IMAGE_RESOURCES: "image resources",
    CAUSE_META_RESOURCES: "meta resources",
    WARN_NO_FILTER_NAME: "No filter found named {0}",
    WARN_NO_FILTER_INDEX: "There are fewer than {0} filters.",
    GALLERY_RESOURCES_MISSING: `
<div class="gallery-resources-alert">
	<strong>Missing or Unspecified Image Information Resources folder</strong>
</div>

Please make sure that a Valid Folder is specified in the settings for the plugin to use to store image information notes!
`,
    GALLERY_INFO_USAGE: `
e.g. Input:

\`\`\`
imgPath:Resources/Images/Image_example_1.png
ignoreInfo:Name;tags;size;backlinks
\`\`\`

----

- Block takes a single argument which is the \`PATH\` of the image.
- Path is the relative path of the file withing the obsidian vault.
- Make sure the image exists!!
- It is case sensitive!
- IgnoreInfo is a list of fields NOT to display(if not included uses Default Hidden Info setting)

----

Please Check Release Notes for plugin changes:<br>
https://github.com/TomNCatz/obsidian-gallery#release-notes
`,
    GALLERY_DISPLAY_USAGE: `
e.g. Input:

\`\`\`gallery
type:active-thumb
path:Weekly
name:.*Calen
tags:photo -car fam
exclusive:true
matchCase:false
imgWidth:400
imgHeight:400
divWidth:70
divAlign:left
divHeight:1400
reverseOrder:false
customList:5 10 2 4
random:0
\`\`\`

----
Full documentation on gallery blocks at:<br>
https://github.com/TomNCatz/obsidian-gallery/blob/main/docs/READEME_DisplayBlocks.md
`
};

// This localization system was mostly taken from https://github.com/sissilab/obsidian-image-toolkit
const localeMap = {
    // ar,
    // cs: cz,
    // da,
    // de,
    en,
    // "en-gb": enGB,
    // es,
    // fr,
    // hi,
    // id,
    // it,
    // ja,
    // ko,
    // nl,
    // nn: no,
    // pl,
    // pt,
    // "pt-br": ptBR,
    // ro,
    // ru,
    // tr,
    // "zh-cn": zhCN,
    // "zh-tw": zhTW,
};
let locale = localeMap[obsidian.moment.locale()];
function loc(str, param1 = null, param2 = null) {
    if (!locale) {
        console.error("No supported localization for region '" + obsidian.moment.locale() + "' falling back to english.", obsidian.moment.locale());
        locale = en;
    }
    const result = locale ? locale[str] : en[str];
    return result.format(param1, param2);
}

const scaleColor = (color, percent) => {
    let rcode = color.substring(1, 3);
    let gcode = color.substring(3, 5);
    let bcode = color.substring(5, 7);
    let r = parseInt(rcode, 16);
    let g = parseInt(gcode, 16);
    let b = parseInt(bcode, 16);
    r *= percent;
    g *= percent;
    b *= percent;
    rcode = Math.ceil(Math.clamp(r, 0, 255)).toString(16).padStart(2, '0');
    gcode = Math.ceil(Math.clamp(g, 0, 255)).toString(16).padStart(2, '0');
    bcode = Math.ceil(Math.clamp(b, 0, 255)).toString(16).padStart(2, '0');
    return "#" + rcode + gcode + bcode;
};
/**
 * Return initial img info file content
 * @param imgPath - Relative vault path of related image
 */
const initializeInfo = (template, imgPath, imgName) => {
    if (!validString(template)) {
        template = DEFAULT_TEMPLATE;
    }
    const uri = preprocessUri(imgPath);
    const infoBlock = "```gallery-info\nimgPath=" + imgPath + "\n```";
    const link = "[" + imgName + "](" + uri + ")";
    const embed = "![](" + uri + ")";
    let final = template;
    final = final.replaceAll(new RegExp(/<%\s*(I|i)(M|m)(G|g)\s*(L|l)(I|i)(N|n)(K|k)\s*%>/g), link);
    final = final.replaceAll(new RegExp(/<%\s*(I|i)(M|m)(G|g)\s*(E|e)(M|m)(B|b)(E|e)(D|d)\s*%>/g), embed);
    final = final.replaceAll(new RegExp(/<%\s*(I|i)(M|m)(G|g)\s*(I|i)(N|n)(F|f)(O|o)\s*%>/g), infoBlock);
    final = final.replaceAll(new RegExp(/<%\s*(I|i)(M|m)(G|g)\s*(U|u)(R|r)(I|i)\s*%>/g), uri);
    final = final.replaceAll(new RegExp(/<%\s*(I|i)(M|m)(G|g)\s*(P|p)(A|a)(T|t)(H|h)\s*%>/g), imgPath);
    final = final.replaceAll(new RegExp(/<%\s*(I|i)(M|m)(G|g)\s*(N|n)(A|a)(M|m)(E|e)\s*%>/g), imgName);
    return final;
};
const preprocessUri = (original) => {
    const uri = original.replaceAll(' ', '%20');
    return uri;
};
const validString = (original, minLength = 0) => {
    if (original === undefined || original === null) {
        return false;
    }
    if (typeof original !== 'string') {
        return false;
    }
    if (original.trim().length <= minLength) {
        return false;
    }
    return true;
};
/**
 * Open the search window to a query.
 * !!!This uses unsafe internal references and may break at any time!!!
 * @param someSearchQuery text of the query
 * @param app ref to the app
 */
const getSearch = async (someSearchQuery, app) => {
    //@ts-ignore
    app.internalPlugins.getPluginById('global-search').instance.openGlobalSearch(someSearchQuery);
};
/**
 * Figures out if the element is partially offscreen
 * @param el element to check
 * @returns
 */
const offScreenPartial = function (el) {
    var rect = el.getBoundingClientRect();
    const a = (rect.x + rect.width) > window.innerWidth;
    const b = (rect.y + rect.height) > window.innerHeight;
    const c = rect.x < 0;
    const d = rect.y < 0;
    return a || b || c || d;
};
/**
 * Figures out if the element is partially offscreen
 * @param el element to check
 * @returns
 */
const screenOffset = function (el) {
    var rect = el.getBoundingClientRect();
    let x = 0;
    let y = 0;
    const a = (rect.x + rect.width) - window.innerWidth;
    if (a > 0) {
        x = -a;
    }
    const b = (rect.y + rect.height) - window.innerHeight;
    if (b > 0) {
        y = -b;
    }
    if (rect.x < 0) {
        x = -rect.x;
    }
    rect.y < 0;
    if (rect.y < 0) {
        y = -rect.y;
    }
    return [x, y];
};
/**
 * get the meta file for an image
 * @param imgPath patht o the image the meat is for
 * @param create if it does not exist should we create one?
 * @param plugin reference to the plugin
 * @returns null if no file exists and we were not told we could create it
 */
const getImageInfo = async (imgPath, create, plugin) => {
    if (plugin.settings.imgDataFolder == null) {
        return null;
    }
    if (!validString(imgPath)) {
        return null;
    }
    if (imgPath.contains("app://") || imgPath.contains("http://localhost")) {
        imgPath = plugin.getImgResources()[imgPath];
        if (!validString(imgPath)) {
            const warning = loc('MISSING_RESOURCE_WARNING', imgPath);
            console.warn(warning);
            new obsidian.Notice(warning);
            return;
        }
    }
    else if (imgPath.contains("http://") || imgPath.contains("https://")) ;
    let infoFile = null;
    let infoPath = plugin.getMetaResources()[imgPath];
    infoFile = plugin.app.vault.getAbstractFileByPath(infoPath);
    if (infoFile instanceof obsidian.TFile) {
        return infoFile;
    }
    if (create) {
        infoFile = await createMetaFile(imgPath, plugin);
        plugin.getMetaResources()[imgPath] = infoFile.path;
        return infoFile;
    }
    // Not found, don't create
    return null;
};
const createMetaFile = async (imgPath, plugin) => {
    // Info File does not exist, Create it
    let counter = 1;
    const imgName = imgPath.split('/').slice(-1)[0];
    let fileName = imgName.substring(0, imgName.lastIndexOf('.'));
    let filepath = obsidian.normalizePath(`${plugin.settings.imgDataFolder}/${fileName}.md`);
    let infoFile;
    while ((infoFile = plugin.app.vault.getAbstractFileByPath(filepath)) instanceof obsidian.TFile) {
        let imgLink = await getimageLink(infoFile, plugin);
        if (imgLink == imgPath) {
            return infoFile;
        }
        filepath = obsidian.normalizePath(`${plugin.settings.imgDataFolder}/${fileName}_${counter}.md`);
        counter++;
    }
    const templateTFile = plugin.app.vault.getAbstractFileByPath(obsidian.normalizePath(plugin.settings.imgmetaTemplatePath + ".md"));
    let template = DEFAULT_TEMPLATE;
    if (templateTFile instanceof obsidian.TFile) {
        template = await plugin.app.vault.read(templateTFile);
    }
    plugin.embedQueue[filepath] = imgPath;
    try {
        return await plugin.app.vault.create(filepath, initializeInfo(template, imgPath, imgName));
    }
    catch (e) {
        infoFile = plugin.app.vault.getAbstractFileByPath(filepath);
        if (infoFile instanceof obsidian.TFile) {
            return infoFile;
        }
        const warning = loc('META_OVERWRITE_CONFLICT', imgPath, filepath);
        console.warn(warning);
        new obsidian.Notice(warning);
    }
};
const getimageLink = async (info, plugin) => {
    let imgLink;
    if (info instanceof obsidian.TFile) {
        const fileCache = plugin.app.metadataCache.getFileCache(info);
        if (fileCache.frontmatter && fileCache.frontmatter.targetImage && fileCache.frontmatter.targetImage.length > 0) {
            imgLink = fileCache.frontmatter.targetImage;
        }
        else {
            // find the info block and get the text from there
            const cache = plugin.app.metadataCache.getFileCache(info);
            if (cache.frontmatter && !(cache.frontmatter.targetImage && cache.frontmatter.targetImage.length > 0)) {
                const infoContent = await plugin.app.vault.read(info);
                const match = /img(P,p)ath=.+/.exec(infoContent);
                if (match) {
                    imgLink = match[0].trim().substring(8);
                    imgLink = obsidian.normalizePath(imgLink);
                    await plugin.app.fileManager.processFrontMatter(info, async (frontmatter) => {
                        frontmatter.targetImage = imgLink;
                    });
                }
            }
        }
    }
    return imgLink;
};
const isRemoteMedia = (source) => {
    return source.contains("http://")
        || source.contains("https://");
};
/**
 * Attempt to scrape the remote target for info and add them to the meta
 * @param imgPath path of media to target
 * @param infoTFile meta file to add info to
 * @param plugin reference to the plugin
 */
const addRemoteMeta = async (imgPath, infoTFile, plugin) => {
    const data = plugin.app.metadataCache.getFileCache(infoTFile);
    if (!data) {
        return false;
    }
    const shouldLink = !(data.frontmatter && data.frontmatter.targetImage && data.frontmatter.targetImage.length > 0);
    if (shouldLink) {
        await plugin.app.fileManager.processFrontMatter(infoTFile, async (frontmatter) => {
            if (shouldLink) {
                frontmatter.targetImage = imgPath;
            }
        });
        return true;
    }
    return false;
};
/**
 * Attempt to scrape the file for tags and add them to the meta
 * @param imgTFile file to scrape
 * @param infoTFile meta file to add tags to
 * @param plugin reference to the plugin
 */
const addEmbededTags = async (imgTFile, infoTFile, plugin) => {
    let keywords;
    const data = plugin.app.metadataCache.getFileCache(infoTFile);
    if (!data) {
        return false;
    }
    if (!plugin.settings.skipMetadataOverwrite || !(data.frontmatter && data.frontmatter.tags && data.frontmatter.tags.length > 0)) {
        keywords = await getJpgTags(imgTFile, plugin);
    }
    const shouldColor = (!imgTFile.path.match(VIDEO_REGEX)
        && obsidian.Platform.isDesktopApp
        && !(data.frontmatter && data.frontmatter.Palette && data.frontmatter.Palette.length > 0));
    const shouldLink = !(data.frontmatter && data.frontmatter.targetImage && data.frontmatter.targetImage.length > 0);
    let colors = [];
    if (shouldColor) {
        const measureEl = new Image();
        measureEl.src = plugin.app.vault.getResourcePath(imgTFile);
        const colorstemp = await extractColors(measureEl, EXTRACT_COLORS_OPTIONS);
        for (let i = 0; i < colorstemp.length; i++) {
            colors.push(colorstemp[i].hex);
        }
    }
    if (shouldLink || keywords || shouldColor) {
        await plugin.app.fileManager.processFrontMatter(infoTFile, async (frontmatter) => {
            if (shouldLink) {
                frontmatter.targetImage = imgTFile.path;
            }
            if (keywords) {
                let field;
                if (validString(plugin.settings.alternativeTags)) {
                    field = plugin.settings.alternativeTags;
                }
                else {
                    field = 'tags';
                }
                let tags = getTags(data, field);
                let newTags = false;
                for (let i = 0; i < keywords.length; i++) {
                    const tag = keywords[i].trim();
                    if (!validString(tag)) {
                        continue;
                    }
                    if (tags.contains(tag)) {
                        continue;
                    }
                    newTags = true;
                    tags.push(tag);
                }
                if (newTags) {
                    setTags(frontmatter, tags, field);
                    frontmatter.tags = tags;
                }
            }
            // Get image colors
            if (shouldColor) {
                const hexList = [];
                for (let i = 0; i < colors.length; i++) {
                    hexList.push(colors[i]);
                }
                frontmatter.Palette = hexList;
            }
        });
        return true;
    }
    return false;
};
const addTag = async (imageInfo, tag, plugin, field = 'tags') => {
    await plugin.app.fileManager.processFrontMatter(imageInfo, (frontmatter) => {
        let tags = getFrontTags(frontmatter, field);
        if (!Array.isArray(tags)) {
            tags = [tags];
        }
        if (tags.contains(tag)) {
            return;
        }
        tags.push(tag);
        setTags(frontmatter, tags, field);
    });
};
const removeTag = async (imageInfo, tag, plugin, field = 'tags') => {
    await plugin.app.fileManager.processFrontMatter(imageInfo, frontmatter => {
        let tags = getFrontTags(frontmatter, field);
        if (!Array.isArray(tags)) {
            tags = [tags];
        }
        let change = false;
        const tagNoHash = tag.replace('#', '');
        const tagAddHash = '#' + tag;
        if (tags.contains(tagNoHash)) {
            tags.remove(tagNoHash);
            change = true;
        }
        if (tags.contains(tag)) {
            tags.remove(tag);
            change = true;
        }
        if (tags.contains(tagAddHash)) {
            tags.remove(tagAddHash);
            change = true;
        }
        if (change) {
            setTags(frontmatter, tags, field);
        }
    });
};
const getFrontTags = (frontmatter, field = 'tags') => {
    var _a;
    let tags;
    let found;
    if (!validString(field)) {
        return tags;
    }
    found = (_a = frontmatter[field]) !== null && _a !== void 0 ? _a : [];
    if (!Array.isArray(found)) {
        tags = [found];
    }
    else {
        tags = found;
    }
    return tags;
};
const getTags = (metaCache, field = 'tags') => {
    var _a;
    let tags;
    let found;
    if (!validString(field)) {
        return tags;
    }
    if (field == 'tags') {
        found = obsidian.getAllTags(metaCache);
    }
    else {
        if (metaCache.frontmatter) {
            found = (_a = metaCache.frontmatter[field]) !== null && _a !== void 0 ? _a : [];
        }
        else {
            found = [];
        }
    }
    if (!Array.isArray(found)) {
        tags = [found];
    }
    else {
        tags = found;
    }
    return tags;
};
const setTags = (frontmatter, tags, field = 'tags') => {
    if (validString(field)) {
        frontmatter[field] = tags;
    }
};
const getJpgTags = async (imgTFile, plugin) => {
    if (!imgTFile) {
        return null;
    }
    let tagInfo;
    try {
        const bits = await plugin.app.vault.readBinary(imgTFile);
        const parser = tsExifParser.ExifParserFactory.create(bits);
        tagInfo = parser.parse();
    }
    catch (e) {
        if (e instanceof Error) {
            new obsidian.Notice(e.message);
        }
        else {
            new obsidian.Notice(e);
        }
    }
    if (!tagInfo || !tagInfo.tags || !tagInfo.tags.XPKeywords) {
        return null;
    }
    let found = "";
    if (Array.isArray(tagInfo.tags.XPKeywords)) {
        var enc = new TextDecoder("utf-8");
        //@ts-ignore
        const tagbinary = new Uint8Array(tagInfo.tags.XPKeywords).buffer;
        found = enc.decode(tagbinary);
        //new Notice("utf-8: "+found)
    }
    else {
        found = tagInfo.tags.XPKeywords;
        //new Notice("string: "+found)
    }
    if (found.contains("\0")) {
        var enc = new TextDecoder("utf-16");
        //@ts-ignore
        const tagbinary = new Uint16Array(tagInfo.tags.XPKeywords).buffer;
        found = enc.decode(tagbinary);
        //new Notice("utf-16: "+found)
    }
    if (found.contains("\0")) {
        found = found.replaceAll("\0", "");
        //new Notice("utf-32: "+found)
    }
    found = found.replaceAll(" ", "_");
    return found.split(/[;,]/);
};
/**
 * used to find potential correct links for when a path has broken
 * @param path old path that is broken
 * @param plugin plugin ref
 * @returns list of file paths that match the file name
 */
const searchForFile = async (path, plugin) => {
    const foundPaths = [];
    const vaultFiles = plugin.app.vault.getFiles();
    const fileName = path.substring(path.lastIndexOf('/'));
    for (const file of vaultFiles) {
        if (EXTENSIONS.contains(file.extension.toLowerCase()) && file.path.contains(fileName)) {
            foundPaths.push(file.path);
        }
    }
    return foundPaths;
};
const setLazyLoading = () => {
    const lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
    let options = {
        root: document.querySelector("ob-gallery-display"),
        // rootMargin: "0px",
        // threshold: 1.0,
    };
    if ("IntersectionObserver" in window) {
        let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    if (entry.target instanceof HTMLImageElement) {
                        entry.target.src = entry.target.dataset.src;
                        entry.target.classList.remove("lazy");
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, options);
        lazyImages.forEach(function (lazyImage) {
            lazyImageObserver.observe(lazyImage);
        });
    }
};
const updateFocus = (imgEl, videoEl, src, isVideo) => {
    if (isVideo) {
        // hide focus image div
        imgEl.style.setProperty('display', 'none');
        // Show focus video div
        videoEl.style.setProperty('display', 'block');
        // Clear Focus image
        imgEl.src = '';
        // Set focus video
        videoEl.src = src;
        return;
    }
    // Show focus image div
    imgEl.style.setProperty('display', 'block');
    // Hide focus video div
    videoEl.style.setProperty('display', 'none');
    // Clear Focus video
    videoEl.src = '';
    // Set focus image
    imgEl.src = src;
};
const ToastMessage = (msg, timeoutInSeconds = 10, contextMenuCallback, contextKey = 'CONTEXT_INFO') => {
    const additionalInfo = contextMenuCallback ? (obsidian.Platform.isDesktop ? loc('TOAST_ADDITIONAL_CONTEXT', loc(contextKey)) : loc('TOAST_ADDITIONAL')) : "";
    const newNotice = new obsidian.Notice(`${loc('PLUGIN_NAME')}\n${msg}\n${additionalInfo}`, timeoutInSeconds * 1000);
    //@ts-ignore
    if (contextMenuCallback)
        newNotice.noticeEl.oncontextmenu = async () => { contextMenuCallback(); };
};

class FuzzyFolders extends obsidian.FuzzySuggestModal {
    getItems() {
        const files = this.app.vault.getAllLoadedFiles();
        const filtered = files.filter((f) => f instanceof obsidian.TFolder);
        return filtered.map((f) => f);
    }
    getItemText(item) {
        return item.path;
    }
    onChooseItem(item, evt) {
        this.onSelection(item.path);
    }
}
class FuzzyFiles extends obsidian.FuzzySuggestModal {
    getItems() {
        const files = this.app.vault.getAllLoadedFiles();
        const filtered = files.filter((f) => f instanceof obsidian.TFile);
        return filtered.map((f) => f);
    }
    getItemText(item) {
        return item.path;
    }
    onChooseItem(item, evt) {
        this.onSelection(item.path);
    }
}
class FuzzyTags extends obsidian.FuzzySuggestModal {
    constructor(plugin) {
        super(plugin.app);
        this.plugin = plugin;
    }
    getItems() {
        return this.plugin.getTags();
    }
    getItemText(item) {
        return item;
    }
    onChooseItem(item, evt) {
        this.onSelection(item);
    }
}

class GallerySettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        let hiddenInfoInput = '';
        let fuzzyFolders = new FuzzyFolders(this.app);
        let fuzzyFiles = new FuzzyFiles(this.app);
        containerEl.empty();
        // Refresh Data button TODO: this is kinda stupid and I should figure out a way to have it sort itself out without the user needing to do anything
        new obsidian.Setting(containerEl)
            .setName(loc('SETTING_DATA_REFRESH_TITLE'))
            .setDesc(loc('SETTING_DATA_REFRESH_DESC'))
            .addButton(text => text
            .setButtonText(loc('SETTING_DATA_REFRESH_BUTTON'))
            .onClick(() => {
            this.plugin.buildCaches();
        }));
        // Unique Mobile Settings
        new obsidian.Setting(containerEl)
            .setName(loc('SETTING_UNIQUE_MOBILE_TITLE'))
            .setDesc(loc('SETTING_UNIQUE_MOBILE_DESC'))
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.uniqueMobileSettings);
            toggle.onChange(async (value) => {
                this.plugin.settings.uniqueMobileSettings = value;
                await this.plugin.saveSettings();
            });
        });
        // Platform Specific Section
        containerEl.createEl('h2', { text: loc('SETTING_PLATFORM_HEADER') });
        // Should right click open the side panel anywhere in the app?
        new obsidian.Setting(containerEl)
            .setName(loc('SETTING_CONTEXT_INFO_TITLE'))
            .setDesc(loc('SETTING_CONTEXT_INFO_DESC'))
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.platformSettings().rightClickInfo);
            toggle.onChange(async (value) => {
                this.plugin.platformSettings().rightClickInfo = value;
                await this.plugin.saveSettings();
            });
        });
        // Should right click open the image menu anywhere in the app?
        new obsidian.Setting(containerEl)
            .setName(loc('SETTING_CONTEXT_MENU_TITLE'))
            .setDesc(loc('SETTING_CONTEXT_MENU_DESC'))
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.platformSettings().rightClickMenu);
            toggle.onChange(async (value) => {
                this.plugin.platformSettings().rightClickMenu = value;
                await this.plugin.saveSettings();
            });
        });
        // Gallery search bar
        new obsidian.Setting(containerEl)
            .setName(loc('SETTING_FILTER_TITLE'))
            .setDesc(loc('SETTING_FILTER_DESC'))
            .addDropdown(dropdown => {
            if (this.plugin.platformSettings().filterType == undefined) {
                this.plugin.platformSettings().filterType = FilterType.NONE;
            }
            //@ts-ignore
            dropdown.addOption(FilterType[FilterType.NONE], loc("FILTER_TYPE_OPTION_" + FilterType.NONE));
            //@ts-ignore
            dropdown.addOption(FilterType[FilterType.SIMPLE], loc("FILTER_TYPE_OPTION_" + FilterType.SIMPLE));
            //@ts-ignore
            dropdown.addOption(FilterType[FilterType.CLASSIC], loc("FILTER_TYPE_OPTION_" + FilterType.CLASSIC));
            //@ts-ignore
            dropdown.addOption(FilterType[FilterType.ADVANCED], loc("FILTER_TYPE_OPTION_" + FilterType.ADVANCED));
            dropdown.setValue(FilterType[this.plugin.platformSettings().filterType]);
            dropdown.onChange(async (value) => {
                switch (value) {
                    case FilterType[FilterType.NONE]:
                        this.plugin.platformSettings().filterType = FilterType.NONE;
                        break;
                    case FilterType[FilterType.SIMPLE]:
                        this.plugin.platformSettings().filterType = FilterType.SIMPLE;
                        break;
                    case FilterType[FilterType.CLASSIC]:
                        this.plugin.platformSettings().filterType = FilterType.CLASSIC;
                        break;
                    case FilterType[FilterType.ADVANCED]:
                        this.plugin.platformSettings().filterType = FilterType.ADVANCED;
                        break;
                    default: return;
                }
                await this.plugin.saveSettings();
            });
        });
        // Default Filter
        new obsidian.Setting(containerEl)
            .setName(loc('SETTING_DEFAULT_FILTER_TITLE'))
            .setDesc(loc('SETTING_DEFAULT_FILTER_DESC'))
            .addDropdown(dropdown => {
            dropdown.addOption("", loc('SETTING_DEFAULT_FILTER_NONE'));
            dropdown.addOption("LAST_USED_FILTER", loc('LAST_USED_FILTER'));
            for (let i = 0; i < this.plugin.settings.namedFilters.length; i++) {
                const name = this.plugin.settings.namedFilters[i].name;
                dropdown.addOption(name, name);
            }
            if (validString(this.plugin.platformSettings().defaultFilter)) {
                dropdown.setValue(this.plugin.platformSettings().defaultFilter);
            }
            else {
                dropdown.setValue("");
            }
            dropdown.onChange(async (value) => {
                this.plugin.platformSettings().defaultFilter = value;
                await this.plugin.saveSettings();
            });
        });
        // Default image width
        new obsidian.Setting(containerEl)
            .setName(loc('SETTING_IMAGE_WIDTH_TITLE'))
            .setDesc(loc('SETTING_IMAGE_WIDTH_DESC'))
            .addText(text => text
            .setPlaceholder(`${this.plugin.platformSettings().width}`)
            .onChange(async (value) => {
            const numValue = parseInt(value);
            if (isNaN(numValue)) {
                return;
            }
            this.plugin.platformSettings().width = Math.abs(numValue);
            await this.plugin.saveSettings();
        }));
        // Use max height?
        new obsidian.Setting(containerEl)
            .setName(loc('SETTING_MAX_HEIGHT_TOGGLE_TITLE'))
            .setDesc(loc('SETTING_MAX_HEIGHT_TOGGLE_DESC'))
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.platformSettings().useMaxHeight);
            toggle.onChange(async (value) => {
                this.plugin.platformSettings().useMaxHeight = value;
                await this.plugin.saveSettings();
                this.display();
            });
        });
        // Max image height
        if (this.plugin.platformSettings().useMaxHeight) {
            new obsidian.Setting(containerEl)
                .setName(loc('SETTING_MAX_HEIGHT_TITLE'))
                .setDesc(loc('SETTING_MAX_HEIGHT_DESC'))
                .addText(text => text
                .setPlaceholder(`${this.plugin.platformSettings().maxHeight}`)
                .onChange(async (value) => {
                const numValue = parseInt(value);
                if (isNaN(numValue)) {
                    return;
                }
                this.plugin.platformSettings().maxHeight = Math.abs(numValue);
                await this.plugin.saveSettings();
            }));
        }
        // Gallery Meta Section
        containerEl.createEl('h2', { text: loc('SETTING_METADATA_HEADER') });
        // Gallery meta folder
        const infoPathSetting = new obsidian.Setting(containerEl)
            .setName(loc('SETTING_META_FOLDER_TITLE'))
            .setDesc('')
            .addButton(text => text
            .setButtonText(this.plugin.settings.imgDataFolder)
            .onClick(() => {
            fuzzyFolders.onSelection = (s) => {
                this.plugin.settings.imgDataFolder = s;
                infoPathSetting.settingEl.querySelector('button').textContent = this.plugin.settings.imgDataFolder;
                this.plugin.saveSettings();
            };
            fuzzyFolders.open();
        }));
        infoPathSetting.descEl.createDiv({ text: loc('SETTING_META_FOLDER_DESC1') });
        infoPathSetting.descEl.createDiv({ text: loc('SETTING_META_FOLDER_DESC2'), attr: { style: 'color: indianred;' } });
        infoPathSetting.descEl.createDiv({ text: loc('SETTING_META_FOLDER_DESC3') });
        infoPathSetting.descEl.createDiv({ text: loc('SETTING_META_FOLDER_DESC4'), attr: { style: 'font-weight: 900;' } });
        infoPathSetting.descEl.createDiv({ text: loc('SETTING_META_FOLDER_DESC5') });
        // Alternative tags field
        new obsidian.Setting(containerEl)
            .setName(loc('SETTING_ALTERNATIVE_TAGS_TITLE'))
            .setDesc(loc('SETTING_ALTERNATIVE_TAGS_DESC'))
            .addText(text => {
            text
                .setValue(this.plugin.settings.alternativeTags)
                .onChange(async (value) => {
                this.plugin.settings.alternativeTags = value;
                await this.plugin.saveSettings();
                this.plugin.buildTagCache();
            });
        });
        // Should add keys even if they already exist
        new obsidian.Setting(containerEl)
            .setName(loc('SETTING_QUICK_IMPORT_TITLE'))
            .setDesc(loc('SETTING_QUICK_IMPORT_DESC'))
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.skipMetadataOverwrite);
            toggle.onChange(async (value) => {
                this.plugin.settings.skipMetadataOverwrite = value;
                await this.plugin.saveSettings();
            });
        });
        // Meta template file    
        const metaTemplatSetting = new obsidian.Setting(containerEl)
            .setName(loc('SETTING_META_TEMPLATE_TITLE'))
            .setDesc('')
            .addButton(text => text
            .setButtonText(this.plugin.settings.imgmetaTemplatePath)
            .onClick(() => {
            fuzzyFiles.onSelection = (s) => {
                this.plugin.settings.imgmetaTemplatePath = s.substring(0, s.length - 3);
                metaTemplatSetting.settingEl.querySelector('button').textContent = this.plugin.settings.imgmetaTemplatePath;
                this.plugin.saveSettings();
            };
            fuzzyFiles.open();
        }));
        metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC1') });
        metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC2') });
        metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC3') });
        metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC4') });
        metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC5') });
        metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC6') });
        metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC7') });
        metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC8') });
        // Hidden meta fields
        const hiddenInfoSetting = new obsidian.Setting(containerEl)
            .setName(loc('SETTING_HIDDEN_INFO_TITLE'))
            .setTooltip(loc('SETTING_HIDDEN_INFO_DESC'))
            .setDesc(``)
            .addText(text => text
            .setPlaceholder(loc('SETTING_HIDDEN_INFO_PLACEHOLDER'))
            .onChange(async (value) => {
            value = value.trim();
            hiddenInfoInput = value;
        }))
            .addButton(text => text
            .setIcon("plus")
            .setTooltip(loc('SETTING_HIDDEN_INFO_ADD'))
            .onClick(() => {
            this.plugin.settings.hiddenInfoTicker[hiddenInfoInput] = true;
            hiddenInfoInput = '';
            this.plugin.saveSettings();
            this.display();
        }))
            .addButton(text => text
            .setIcon('rotate-ccw')
            .setTooltip(loc('SETTING_HIDDEN_INFO_RESET'))
            .onClick(() => {
            this.plugin.settings.hiddenInfoTicker = Object.assign({}, DEFAULT_HIDDEN_INFO);
            this.plugin.saveSettings();
            this.display();
        }));
        this.drawToggleLists(hiddenInfoSetting.descEl, this.plugin.settings.hiddenInfoTicker);
        // Auto complete fields
        const autoCompleteSetting = new obsidian.Setting(containerEl)
            .setName(loc('SETTING_AUTO_COMPLETE_TITLE'))
            .setTooltip(loc('SETTING_AUTO_COMPLETE_DESC'))
            .setDesc(``)
            .addText(text => text
            .setPlaceholder(loc('SETTING_AUTO_COMPLETE_PLACEHOLDER'))
            .onChange(async (value) => {
            value = value.trim();
            hiddenInfoInput = value;
        }))
            .addButton(text => text
            .setIcon("plus")
            .setTooltip(loc('SETTING_AUTO_COMPLETE_ADD'))
            .onClick(() => {
            this.plugin.settings.autoCompleteFields[hiddenInfoInput] = true;
            hiddenInfoInput = '';
            this.plugin.saveSettings();
            this.display();
        }))
            .addButton(text => text
            .setIcon('rotate-ccw')
            .setTooltip(loc('SETTING_AUTO_COMPLETE_RESET'))
            .onClick(() => {
            this.plugin.settings.autoCompleteFields = {};
            this.plugin.saveSettings();
            this.display();
        }));
        this.drawToggleLists(autoCompleteSetting.descEl, this.plugin.settings.autoCompleteFields);
        // Gallery Meta Section
        containerEl.createEl('h2', { text: loc('SETTING_METADATA_HEADER') });
        for (let i = 0; i < this.plugin.settings.namedFilters.length; i++) {
            const filter = this.plugin.settings.namedFilters[i];
            new obsidian.Setting(containerEl)
                .setName(filter.name)
                .addTextArea(text => {
                text
                    .setValue(filter.filter)
                    .onChange(async (value) => {
                    filter.filter = value;
                    await this.plugin.saveSettings();
                });
                text.inputEl.style.width = "100%";
            })
                .addButton(button => {
                button
                    .setIcon("trash-2")
                    .setTooltip(loc('SETTING_FILTER_REMOVE'))
                    .onClick(async () => {
                    delete this.plugin.settings.namedFilters[i];
                    await this.plugin.saveSettings();
                    this.display();
                });
            });
        }
    }
    drawToggleLists(containerEl, records) {
        const fields = Object.keys(records);
        for (let i = 0; i < fields.length; i++) {
            const element = fields[i];
            new obsidian.Setting(containerEl)
                .setName(element)
                .addToggle((toggle) => {
                toggle.setValue(records[element]);
                toggle.onChange(async (value) => {
                    records[element] = value;
                    await this.plugin.saveSettings();
                });
            })
                .addButton(button => {
                button
                    .setIcon("trash-2")
                    .setTooltip(loc('SETTING_HIDDEN_INFO_REMOVE'))
                    .onClick(async () => {
                    delete records[element];
                    await this.plugin.saveSettings();
                    this.display();
                });
            });
        }
    }
}

var InfoType;
(function (InfoType) {
    InfoType["NAME"] = "name";
    InfoType["PATH"] = "path";
    InfoType["TAG"] = "tag";
    InfoType["REGEX"] = "regex";
    InfoType["FRONTMATTER"] = "";
})(InfoType || (InfoType = {}));
var Mods;
(function (Mods) {
    Mods["EXPLICIT"] = "!";
    Mods["NEGATE"] = "-";
    Mods["CASE"] = "^";
})(Mods || (Mods = {}));
const parseAdvanceSearch = (input, mediaSearch, clear = false) => {
    const parts = input.split(/([ ,;\n\r])/);
    const rules = [];
    let rule;
    while (parts.length > 0) {
        let part = parts.shift().trim();
        if (part.contains(':')) {
            let id = part.substring(0, part.indexOf(':'));
            part = part.substring(part.indexOf(':') + 1);
            if (rule != null) {
                rules.push(rule);
                rule = null;
            }
            switch (id.toLowerCase()) {
                case InfoType.PATH:
                    rule = { infoType: InfoType.PATH, info: "" };
                    break;
                case InfoType.REGEX:
                    rule = { infoType: InfoType.REGEX, info: "" };
                    break;
                case InfoType.NAME:
                    rule = { infoType: InfoType.NAME, info: "" };
                    break;
                case InfoType.TAG:
                    rule = { infoType: InfoType.TAG, info: "" };
                    break;
                default:
                    rule = { infoType: id, info: "" };
                    break;
            }
        }
        if (part != "") {
            if (rule == null) {
                rule = { infoType: InfoType.TAG, info: "" };
            }
            rule.info += " " + part;
        }
    }
    if (rule != null) {
        rules.push(rule);
    }
    if (clear) {
        mediaSearch.exclusive = false;
        mediaSearch.path = "";
        mediaSearch.name = "";
        mediaSearch.tag = "";
        mediaSearch.regex = "";
        mediaSearch.front = {};
    }
    for (let i = 0; i < rules.length; i++) {
        const item = rules[i];
        switch (item.infoType) {
            case InfoType.PATH:
                mediaSearch.path = item.info.trim();
                break;
            case InfoType.REGEX:
                mediaSearch.regex = item.info.trim();
                break;
            case InfoType.NAME:
                mediaSearch.name = item.info.trim();
                break;
            case InfoType.TAG:
                mediaSearch.tag = item.info.trim();
                break;
            default:
                mediaSearch.front[item.infoType] = item.info.trim();
                break;
        }
    }
};
const parseFilterInfo = (filter) => {
    let result = [];
    if (validString(filter)) {
        const filterItems = filter.split(/[ ,;\n\r]/);
        for (let k = 0; k < filterItems.length; k++) {
            const current = { mods: [], key: filterItems[k] };
            let checking = true;
            while (checking) {
                switch (current.key[0]) {
                    case Mods.EXPLICIT:
                        current.mods.push(Mods.EXPLICIT);
                        current.key = current.key.substring(1);
                        break;
                    case Mods.NEGATE:
                        current.mods.push(Mods.NEGATE);
                        current.key = current.key.substring(1);
                        break;
                    case Mods.CASE:
                        current.mods.push(Mods.CASE);
                        current.key = current.key.substring(1);
                        break;
                    default:
                        checking = false;
                        break;
                }
            }
            if (validString(current.key)) {
                if (current.mods.length > 0) {
                    result.unshift(current);
                }
                else {
                    result.push(current);
                }
            }
        }
    }
    return result;
};

var _MediaSearch_instances, _MediaSearch_applyFilter, _MediaSearch_buildRegex, _MediaSearch_matchScore, _MediaSearch_containsTag, _MediaSearch_getFrontmatter;
var Sorting;
(function (Sorting) {
    Sorting[Sorting["UNSORTED"] = 0] = "UNSORTED";
    Sorting[Sorting["NAME"] = 1] = "NAME";
    Sorting[Sorting["PATH"] = 2] = "PATH";
    Sorting[Sorting["CDATE"] = 3] = "CDATE";
    Sorting[Sorting["MDATE"] = 4] = "MDATE";
    Sorting[Sorting["SIZE"] = 5] = "SIZE";
})(Sorting || (Sorting = {}));
class MediaSearch {
    constructor(plugin) {
        _MediaSearch_instances.add(this);
        this.imgList = [];
        this.totalCount = 0;
        this.selectMode = false;
        this.redraw = false;
        this.selectedEls = [];
        this.plugin = plugin;
        this.clearFilter();
    }
    stringToSort(sort) {
        sort = sort.toLocaleLowerCase();
        switch (sort) {
            case Sorting[Sorting.UNSORTED].toLocaleLowerCase():
                this.sorting = Sorting.UNSORTED;
                break;
            case Sorting[Sorting.NAME].toLocaleLowerCase():
                this.sorting = Sorting.NAME;
                break;
            case Sorting[Sorting.PATH].toLocaleLowerCase():
                this.sorting = Sorting.PATH;
                break;
            case Sorting[Sorting.CDATE].toLocaleLowerCase():
                this.sorting = Sorting.CDATE;
                break;
            case Sorting[Sorting.MDATE].toLocaleLowerCase():
                this.sorting = Sorting.MDATE;
                break;
            case Sorting[Sorting.SIZE].toLocaleLowerCase():
                this.sorting = Sorting.SIZE;
                break;
            default:
                this.sorting = Sorting.UNSORTED;
                break;
        }
    }
    updateSort(sorting, reverse) {
        if (!this.redraw
            && sorting == this.sorting
            && reverse == this.reverse) {
            return;
        }
        if (this.redraw || sorting != this.sorting) {
            this.sorting = sorting;
            switch (this.sorting) {
                case Sorting.UNSORTED: break;
                case Sorting.NAME:
                    {
                        this.imgList = this.imgList.sort((a, b) => {
                            let as = this.plugin.imgResources[a];
                            let bs = this.plugin.imgResources[b];
                            as = as.substring(as.lastIndexOf('/'));
                            bs = bs.substring(bs.lastIndexOf('/'));
                            return as.localeCompare(bs);
                        });
                        break;
                    }
                case Sorting.PATH:
                    {
                        this.imgList = this.imgList.sort((a, b) => {
                            return this.plugin.imgResources[a].localeCompare(this.plugin.imgResources[b]);
                        });
                        break;
                    }
                case Sorting.CDATE:
                    {
                        this.imgList = this.imgList.sort((a, b) => {
                            let af = this.plugin.app.vault.getAbstractFileByPath(this.plugin.imgResources[a]);
                            let bf = this.plugin.app.vault.getAbstractFileByPath(this.plugin.imgResources[b]);
                            if (af.stat.ctime < bf.stat.ctime) {
                                return 1;
                            }
                            if (af.stat.ctime == bf.stat.ctime) {
                                return 0;
                            }
                            return -1;
                        });
                        break;
                    }
                case Sorting.MDATE:
                    {
                        this.imgList = this.imgList.sort((a, b) => {
                            let ap = this.plugin.metaResources[this.plugin.imgResources[a]];
                            let bp = this.plugin.metaResources[this.plugin.imgResources[b]];
                            let af = this.plugin.app.vault.getAbstractFileByPath(ap);
                            let bf = this.plugin.app.vault.getAbstractFileByPath(bp);
                            if (!af) {
                                af = this.plugin.app.vault.getAbstractFileByPath(this.plugin.imgResources[a]);
                            }
                            if (!bf) {
                                bf = this.plugin.app.vault.getAbstractFileByPath(this.plugin.imgResources[b]);
                            }
                            if (af.stat.mtime < bf.stat.mtime) {
                                return 1;
                            }
                            if (af.stat.mtime == bf.stat.mtime) {
                                return 0;
                            }
                            return -1;
                        });
                        break;
                    }
                case Sorting.SIZE:
                    {
                        this.imgList = this.imgList.sort((a, b) => {
                            let af = this.plugin.app.vault.getAbstractFileByPath(this.plugin.imgResources[a]);
                            let bf = this.plugin.app.vault.getAbstractFileByPath(this.plugin.imgResources[b]);
                            if (af.stat.size < bf.stat.size) {
                                return 1;
                            }
                            if (af.stat.size == bf.stat.size) {
                                return 0;
                            }
                            return -1;
                        });
                        break;
                    }
            }
            this.redraw = true;
        }
        if (this.redraw) {
            if (reverse) {
                this.imgList = this.imgList.reverse();
            }
        }
        else if (reverse != this.reverse) {
            this.imgList = this.imgList.reverse();
            this.redraw = true;
        }
        this.reverse = reverse;
    }
    async updateLastFilter() {
        this.plugin.platformSettings().lastFilter = this.getFilter();
        await this.plugin.saveSettings();
    }
    async updateData() {
        await __classPrivateFieldGet(this, _MediaSearch_instances, "m", _MediaSearch_applyFilter).call(this);
        if (this.random > 0) {
            this.customList = [];
            if (this.random < this.imgList.length) {
                while (this.customList.length < this.random) {
                    const value = Math.floor(Math.random() * this.imgList.length);
                    if (!this.customList.contains(value)) {
                        this.customList.push(value);
                    }
                }
            }
        }
        if (this.customList && this.customList.length > 0) {
            this.imgList = this.customList.filter(value => !Number.isNaN(value)).map(i => this.imgList[i]);
        }
        this.redraw = true;
        this.updateSort(this.sorting, this.reverse);
    }
    setNamedFilter(filter) {
        this.plugin.settings.namedFilters;
        for (let i = 0; i < this.plugin.settings.namedFilters.length; i++) {
            if (this.plugin.settings.namedFilters[i].name.toLowerCase() == filter.toLowerCase()) {
                this.setIndexedFilter(i);
                return;
            }
        }
        console.log(loc('WARN_NO_FILTER_NAME', filter));
        new obsidian.Notice(loc('WARN_NO_FILTER_NAME', filter));
    }
    setIndexedFilter(index) {
        if (this.plugin.settings.namedFilters.length > index) {
            this.setFilter(this.plugin.settings.namedFilters[index].filter);
        }
        else {
            console.log(loc('WARN_NO_FILTER_INDEX', index.toString()));
            new obsidian.Notice(loc('WARN_NO_FILTER_INDEX', index.toString()));
        }
    }
    getFilter() {
        let filterCopy = "```gallery";
        filterCopy += "\npath:" + this.path;
        filterCopy += "\nname:" + this.name;
        filterCopy += "\ntags:" + this.tag;
        filterCopy += "\nregex:" + this.regex;
        filterCopy += "\nmatchCase:" + this.matchCase;
        filterCopy += "\nexclusive:" + this.exclusive;
        filterCopy += "\nimgWidth:" + this.maxWidth;
        filterCopy += "\nsort:" + Sorting[this.sorting];
        filterCopy += "\nreverseOrder:" + this.reverse;
        filterCopy += "\nrandom:" + this.random;
        const frontList = Object.keys(this.front);
        if (frontList.length > 0) {
            for (let i = 0; i < frontList.length; i++) {
                filterCopy += "\n" + frontList[i] + ":" + this.front[frontList[i]];
            }
        }
        filterCopy += "\n```";
        return filterCopy;
    }
    setFilter(filter) {
        const lines = filter.split(/[\n\r]/);
        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].split(':');
            if (parts.length < 2) {
                continue;
            }
            parts[1] = parts[1].trim();
            switch (parts[0].trim().toLocaleLowerCase()) {
                case 'path':
                    this.path = parts[1];
                    break;
                case 'name':
                    this.name = parts[1];
                    break;
                case 'tags':
                    this.tag = parts[1];
                    break;
                case 'regex':
                    this.regex = parts[1];
                    break;
                case 'matchcase':
                    this.matchCase = (parts[1].toLocaleLowerCase() === "true");
                    break;
                case 'exclusive':
                    this.exclusive = (parts[1].toLocaleLowerCase() === "true");
                    break;
                case 'imgwidth':
                    this.maxWidth = parseInt(parts[1]);
                    break;
                case 'sort':
                    this.stringToSort(parts[1]);
                    break;
                case 'reverseorder':
                    this.reverse = (parts[1].toLocaleLowerCase() === "true");
                    break;
                case 'random':
                    this.random = parseInt(parts[1]);
                    break;
                default:
                    this.front[parts[0]] = parts[1];
                    break;
            }
        }
    }
    clearFilter() {
        this.path = "";
        this.name = "";
        this.tag = "";
        this.regex = "";
        this.front = {};
        this.matchCase = false;
        this.exclusive = false;
        this.sorting = Sorting.UNSORTED;
        this.reverse = false;
        this.random = 0;
        this.maxWidth = this.plugin.platformSettings().width;
        if (this.plugin.platformSettings().useMaxHeight) {
            this.maxHeight = this.plugin.platformSettings().maxHeight;
        }
        else {
            this.maxHeight = 0;
        }
        this.random = 0;
        this.customList = null;
    }
}
_MediaSearch_instances = new WeakSet(), _MediaSearch_applyFilter = async function _MediaSearch_applyFilter() {
    this.totalCount = 0;
    let reg = __classPrivateFieldGet(this, _MediaSearch_instances, "m", _MediaSearch_buildRegex).call(this);
    let validFilter = false;
    const tagFilter = parseFilterInfo(this.tag);
    if (tagFilter.length > 0) {
        validFilter = true;
    }
    const frontList = Object.keys(this.front);
    const frontFilters = [];
    for (let f = 0; f < frontList.length; f++) {
        frontFilters[f] = parseFilterInfo(this.front[frontList[f]]);
        if (frontFilters[f].length > 0) {
            validFilter = true;
        }
    }
    const keyList = Object.keys(this.plugin.getImgResources());
    this.imgList = [];
    for (const key of keyList) {
        const file = this.plugin.getImgResources()[key];
        for (let i = 0; i < reg.length; i++) {
            if (file.match(reg[i])) {
                this.totalCount++;
                let imgTags = [];
                let frontMatter = {};
                let infoFile = await getImageInfo(file, false, this.plugin);
                if (infoFile) {
                    let imgInfoCache = this.plugin.app.metadataCache.getFileCache(infoFile);
                    if (imgInfoCache) {
                        imgTags = getTags(imgInfoCache);
                        frontMatter = __classPrivateFieldGet(this, _MediaSearch_instances, "m", _MediaSearch_getFrontmatter).call(this, imgInfoCache);
                    }
                }
                let score = __classPrivateFieldGet(this, _MediaSearch_instances, "m", _MediaSearch_matchScore).call(this, imgTags, tagFilter, this.matchCase, this.exclusive);
                for (let f = 0; f < frontList.length; f++) {
                    let field = [];
                    if (frontMatter.hasOwnProperty(frontList[f])) {
                        field = frontMatter[frontList[f]];
                    }
                    score += __classPrivateFieldGet(this, _MediaSearch_instances, "m", _MediaSearch_matchScore).call(this, field, frontFilters[f], this.matchCase, this.exclusive);
                }
                if ((validFilter && score > 0)
                    || (!validFilter && score >= 0)) {
                    this.imgList.push(key);
                }
                break;
            }
        }
    }
}, _MediaSearch_buildRegex = function _MediaSearch_buildRegex() {
    let reg = [];
    const names = this.name.split(/[;,\n\r]/);
    for (let i = 0; i < names.length; i++) {
        names[i] = names[i].trim();
        if (names[i] == "") {
            continue;
        }
        try {
            if (this.regex.trim() != "") {
                reg.push(new RegExp(this.regex.replaceAll("{PATH}", this.path).replaceAll("{NAME}", this.name[i])));
            }
            else if (this.path === '/') {
                reg.push(new RegExp(`^.*${names[i]}.*$`));
            }
            else {
                reg.push(new RegExp(`^${this.path}.*${names[i]}.*$`));
            }
        }
        catch (error) {
            console.log(loc('BAD_REGEX_WARNING'));
        }
    }
    if (reg.length == 0) {
        reg.push(new RegExp(`^${this.path}.*$`));
    }
    return reg;
}, _MediaSearch_matchScore = function _MediaSearch_matchScore(imgTags, filter, matchCase, exclusive) {
    const fail = -999;
    if (filter == null || filter.length == 0) {
        return 0;
    }
    if (imgTags == null) {
        return fail;
    }
    let hasPositive = false;
    let exclusiveMatched = false;
    for (let k = 0; k < filter.length; k++) {
        let criteria = filter[k];
        let negate = criteria.mods.contains(Mods.NEGATE);
        let exclusiveInternal = criteria.mods.contains(Mods.EXPLICIT);
        if (!negate) {
            hasPositive = true;
        }
        if (!validString(criteria.key)) {
            continue;
        }
        if (__classPrivateFieldGet(this, _MediaSearch_instances, "m", _MediaSearch_containsTag).call(this, criteria.key, imgTags, matchCase || criteria.mods.contains(Mods.CASE))) {
            if (negate) {
                return fail;
            }
            if (!exclusive && !exclusiveInternal) {
                return 1;
            }
            else {
                exclusiveMatched = true;
            }
        }
        else if ((exclusive || exclusiveInternal) && !negate) {
            return fail;
        }
    }
    if (!hasPositive) {
        return 1;
    }
    if (exclusive || exclusiveMatched) {
        return 1;
    }
    return fail;
}, _MediaSearch_containsTag = function _MediaSearch_containsTag(tagFilter, tags, matchCase) {
    if (!matchCase) {
        tagFilter = tagFilter.toLowerCase();
    }
    for (let i = 0; i < tags.length; i++) {
        if (matchCase) {
            if (tags[i].contains(tagFilter)) {
                return true;
            }
        }
        else {
            if (tags[i].toLowerCase().contains(tagFilter)) {
                return true;
            }
        }
    }
    return false;
}, _MediaSearch_getFrontmatter = function _MediaSearch_getFrontmatter(imgInfoCache) {
    var _a;
    const result = {};
    if (imgInfoCache.frontmatter) {
        const frontList = Object.keys(imgInfoCache.frontmatter);
        for (let i = 0; i < frontList.length; i++) {
            let element = (_a = imgInfoCache.frontmatter[frontList[i]]) !== null && _a !== void 0 ? _a : [];
            if (!Array.isArray(element)) {
                element = [element];
            }
            result[frontList[i]] = element;
        }
    }
    return result;
};

class GalleryInfoView extends obsidian.ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.infoFile = null;
        this.editing = false;
        this.plugin = plugin;
        // Get View Container Element
        this.viewEl = this.containerEl.getElementsByClassName('view-content')[0];
        // Add Preview Mode Container
        this.previewEl = this.viewEl.createDiv({
            cls: 'markdown-preview-view',
        });
        this.editToggle = this.previewEl.createEl('a', {
            cls: 'view-action',
            attr: { 'aria-label': loc('SIDE_PANEL_EDIT_TOOLTIP') }
        });
        this.editToggle.addEventListener('click', (event) => {
            this.editing = !this.editing;
            this.updateToggleButton();
            this.render();
        });
        this.contentEl = this.previewEl.createDiv({
            cls: 'markdown-preview-sizer markdown-preview-section gallery-info-panel'
        });
        // Add Source Mode Container
        this.sourceEl = this.viewEl.createDiv({ cls: 'cm-s-obsidian', attr: { style: 'display: none' } });
        // Add code mirro editor
        this.editorEl = this.sourceEl.createEl('textarea', { cls: 'image-info-cm-editor' });
        this.render = this.render.bind(this);
        this.clear = this.clear.bind(this);
        this.updateInfoDisplay = this.updateInfoDisplay.bind(this);
    }
    getViewType() {
        return OB_GALLERY_INFO;
    }
    getDisplayText() {
        return loc("IMAGE_INFO_TITLE");
    }
    getIcon() {
        return 'image';
    }
    getState() {
        return {
            filePath: this.infoFile.path,
        };
    }
    async setState(state, result) {
        if (this.infoFile != null) {
            super.setState(state, result);
            return;
        }
        if (state && typeof state === "object") {
            if ("filePath" in state &&
                state.filePath &&
                typeof state.filePath === "string") {
                const infoFile = this.plugin.app.vault.getAbstractFileByPath(state.filePath);
                if (infoFile instanceof obsidian.TFile) {
                    this.infoFile = infoFile;
                    this.updateInfoDisplay(null);
                }
            }
        }
        super.setState(state, result);
    }
    async onClose() {
        // Clear the preview and editor history
        this.clear();
        await Promise.resolve();
    }
    onload() {
    }
    static async OpenLeaf(plugin, imgPath = null) {
        if (!validString(imgPath, 4)) {
            return;
        }
        // Open Info panel
        const workspace = plugin.app.workspace;
        let infoView = workspace.getLeavesOfType(OB_GALLERY_INFO)[0];
        if (!infoView) {
            if (!workspace.layoutReady) {
                return;
            }
            await workspace.getRightLeaf(false).setViewState({ type: OB_GALLERY_INFO });
            infoView = workspace.getLeavesOfType(OB_GALLERY_INFO)[0];
        }
        workspace.revealLeaf(infoView);
        if ((infoView === null || infoView === void 0 ? void 0 : infoView.view) instanceof GalleryInfoView) {
            infoView.view.updateInfoDisplay(imgPath);
            return infoView.view;
        }
        return null;
    }
    static closeInfoLeaf(plugin) {
        plugin.app.workspace.detachLeavesOfType(OB_GALLERY_INFO);
    }
    async updateInfoDisplay(imgPath) {
        if (!validString(imgPath, 4)) {
            if (!this.infoFile) {
                return;
            }
        }
        else {
            this.plugin.app.workspace.requestSaveLayout();
            this.infoFile = await getImageInfo(imgPath, true, this.plugin);
        }
        if (!this.infoFile) {
            return;
        }
        this.editing = false;
        this.updateToggleButton();
        this.plugin.app.workspace.requestSaveLayout();
        // Handle disabled img info functionality or missing info block
        let infoText = loc('GALLERY_RESOURCES_MISSING');
        if (this.infoFile) {
            infoText = await this.app.vault.cachedRead(this.infoFile);
        }
        // Clear the preview and editor history
        this.clear();
        this.fileContent = infoText;
        this.render();
    }
    updateToggleButton() {
        if (this.infoFile) {
            obsidian.setIcon(this.editToggle, this.editing ? "book-open" : "pencil");
        }
        else {
            obsidian.setIcon(this.editToggle, "");
        }
    }
    async render() {
        this.contentEl.empty();
        if (this.editing) {
            const test = this.contentEl.createEl("textarea", { cls: "gallery-info-panel-edit" });
            test.value = this.fileContent;
            test.addEventListener('blur', async () => {
                if (this.fileContent == test.value) {
                    return;
                }
                this.fileContent = test.value;
                await this.plugin.app.vault.modify(this.infoFile, this.fileContent);
                new obsidian.Notice(loc('SIDE_PANEL_SAVE_NOTICE'));
            });
        }
        else {
            obsidian.MarkdownRenderer.render(this.app, this.fileContent, this.contentEl, this.infoFile.path, this);
        }
    }
    clear() {
        this.contentEl.empty();
        this.fileContent = '';
    }
}

var _ConfirmModal_info;
class ConfirmModal extends obsidian.Modal {
    constructor(app, info, onConfirm) {
        super(app);
        this.confirmLabel = loc('CONFIRM');
        this.cancelLabel = loc('CANCEL');
        _ConfirmModal_info.set(this, void 0);
        this.onConfirm = onConfirm;
        __classPrivateFieldSet(this, _ConfirmModal_info, info, "f");
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h1", { text: __classPrivateFieldGet(this, _ConfirmModal_info, "f") });
        new obsidian.Setting(contentEl)
            .addButton((btn) => btn
            .setButtonText(this.confirmLabel)
            .setCta()
            .onClick(() => {
            this.close();
            this.onConfirm();
        }))
            .addButton((btn) => btn
            .setButtonText(this.cancelLabel)
            .setCta()
            .onClick(() => {
            this.close();
            if (this.onCancel) {
                this.onCancel();
            }
        }));
    }
    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}
_ConfirmModal_info = new WeakMap();

var _ProgressModal_plugin, _ProgressModal_onCancel, _ProgressModal_complete, _ProgressModal_total, _ProgressModal_progressEl, _ProgressModal_settingEl;
class ProgressModal extends obsidian.Modal {
    constructor(plugin, total, onCancel) {
        super(plugin.app);
        _ProgressModal_plugin.set(this, void 0);
        _ProgressModal_onCancel.set(this, void 0);
        _ProgressModal_complete.set(this, false);
        _ProgressModal_total.set(this, void 0);
        _ProgressModal_progressEl.set(this, void 0);
        _ProgressModal_settingEl.set(this, void 0);
        __classPrivateFieldSet(this, _ProgressModal_plugin, plugin, "f");
        __classPrivateFieldSet(this, _ProgressModal_onCancel, onCancel, "f");
        __classPrivateFieldSet(this, _ProgressModal_total, total, "f");
    }
    updateProgress(complete) {
        if (complete >= __classPrivateFieldGet(this, _ProgressModal_total, "f") - 1) {
            __classPrivateFieldSet(this, _ProgressModal_complete, true, "f");
            this.close();
            return;
        }
        if (complete == 0) {
            return;
        }
        __classPrivateFieldGet(this, _ProgressModal_progressEl, "f").style.width = (complete * 100 / __classPrivateFieldGet(this, _ProgressModal_total, "f")) + "%";
        __classPrivateFieldGet(this, _ProgressModal_settingEl, "f").descEl.innerText = `${complete}/${__classPrivateFieldGet(this, _ProgressModal_total, "f")}`;
    }
    onOpen() {
        const { contentEl } = this;
        const bar = contentEl.createDiv();
        bar.style.height = "25px";
        bar.style.width = "100%";
        bar.style.backgroundColor = "#333";
        __classPrivateFieldSet(this, _ProgressModal_progressEl, bar.createDiv(), "f");
        __classPrivateFieldGet(this, _ProgressModal_progressEl, "f").style.height = "100%";
        __classPrivateFieldGet(this, _ProgressModal_progressEl, "f").style.width = "0%";
        __classPrivateFieldGet(this, _ProgressModal_progressEl, "f").style.backgroundColor = __classPrivateFieldGet(this, _ProgressModal_plugin, "f").accentColor;
        if (__classPrivateFieldGet(this, _ProgressModal_onCancel, "f")) {
            __classPrivateFieldSet(this, _ProgressModal_settingEl, new obsidian.Setting(contentEl)
                .setDesc('')
                .addButton((btn) => btn
                .setButtonText(loc('CANCEL'))
                .setCta()
                .onClick(() => {
                __classPrivateFieldGet(this, _ProgressModal_onCancel, "f").call(this);
                __classPrivateFieldSet(this, _ProgressModal_complete, true, "f");
                this.close();
            })), "f");
        }
    }
    onClose() {
        if (!__classPrivateFieldGet(this, _ProgressModal_complete, "f") && __classPrivateFieldGet(this, _ProgressModal_onCancel, "f")) {
            __classPrivateFieldGet(this, _ProgressModal_onCancel, "f").call(this);
        }
        let { contentEl } = this;
        contentEl.empty();
    }
}
_ProgressModal_plugin = new WeakMap(), _ProgressModal_onCancel = new WeakMap(), _ProgressModal_complete = new WeakMap(), _ProgressModal_total = new WeakMap(), _ProgressModal_progressEl = new WeakMap(), _ProgressModal_settingEl = new WeakMap();

var _SuggestionDropdown_instances, _SuggestionDropdown_self, _SuggestionDropdown_suggestions, _SuggestionDropdown_showing, _SuggestionDropdown_selected, _SuggestionDropdown_input, _SuggestionDropdown_leftLocked, _SuggestionDropdown_onKeyDown, _SuggestionDropdown_onKeyUp, _SuggestionDropdown_submit, _SuggestionDropdown_updateSuggestions, _SuggestionDropdown_select, _SuggestionDropdown_show, _SuggestionDropdown_cleanUp;
class SuggestionDropdown {
    constructor(target, getItems, onSubmit) {
        _SuggestionDropdown_instances.add(this);
        this.showOnClick = true;
        this.ignoreList = [];
        _SuggestionDropdown_self.set(this, void 0);
        _SuggestionDropdown_suggestions.set(this, void 0);
        _SuggestionDropdown_showing.set(this, false);
        _SuggestionDropdown_selected.set(this, void 0);
        _SuggestionDropdown_input.set(this, void 0);
        _SuggestionDropdown_leftLocked.set(this, void 0);
        this.target = target;
        this.onGetItems = getItems;
        this.onSubmit = onSubmit;
        __classPrivateFieldSet(this, _SuggestionDropdown_self, createDiv({ cls: "suggestion-container" }), "f");
        __classPrivateFieldSet(this, _SuggestionDropdown_suggestions, __classPrivateFieldGet(this, _SuggestionDropdown_self, "f").createDiv("#suggestions-scroll"), "f");
        __classPrivateFieldGet(this, _SuggestionDropdown_suggestions, "f").style.maxHeight = 300 + "px";
        __classPrivateFieldGet(this, _SuggestionDropdown_suggestions, "f").style.overflowY = "auto";
        this.target.addEventListener("input", async () => {
            await __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_updateSuggestions).call(this, this.target.value);
            __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_show).call(this);
        });
        this.target.addEventListener('click', async () => {
            if (this.showOnClick) {
                await __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_updateSuggestions).call(this, this.target.value);
                __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_show).call(this);
            }
        });
        this.target.addEventListener("keydown", (ev) => { __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_onKeyDown).call(this, ev); });
        this.target.addEventListener("keyup", (ev) => { __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_onKeyUp).call(this, ev); });
        this.target.addEventListener("blur", () => { __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_cleanUp).call(this); });
        this.target.addEventListener("change", () => { __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_cleanUp).call(this); });
    }
    cancel() {
        __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_cleanUp).call(this);
    }
    getCoords() {
        if (!this.target) {
            return;
        }
        const box = this.target.getBoundingClientRect();
        const body = document.body;
        const docEl = document.documentElement;
        const scrollTop = window.scrollY || docEl.scrollTop || body.scrollTop;
        const scrollLeft = window.scrollX || docEl.scrollLeft || body.scrollLeft;
        const clientTop = docEl.clientTop || body.clientTop || 0;
        const clientLeft = docEl.clientLeft || body.clientLeft || 0;
        const top = box.top + box.height + scrollTop - clientTop;
        const left = box.left + scrollLeft - clientLeft;
        return [Math.round(top), Math.round(left)];
    }
}
_SuggestionDropdown_self = new WeakMap(), _SuggestionDropdown_suggestions = new WeakMap(), _SuggestionDropdown_showing = new WeakMap(), _SuggestionDropdown_selected = new WeakMap(), _SuggestionDropdown_input = new WeakMap(), _SuggestionDropdown_leftLocked = new WeakMap(), _SuggestionDropdown_instances = new WeakSet(), _SuggestionDropdown_onKeyDown = function _SuggestionDropdown_onKeyDown(event) {
    switch (event.key) {
        case "Enter":
            __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_submit).call(this);
            break;
        case "Escape":
            if (!__classPrivateFieldGet(this, _SuggestionDropdown_showing, "f")) {
                this.target.blur();
            }
            this.cancel();
            break;
        case "ArrowRight":
            this.cancel();
            break;
        case "ArrowLeft":
            this.cancel();
            break;
        case "ArrowUp":
            {
                if (!__classPrivateFieldGet(this, _SuggestionDropdown_selected, "f"))
                    return;
                let index = Array.prototype.indexOf.call(__classPrivateFieldGet(this, _SuggestionDropdown_suggestions, "f").children, __classPrivateFieldGet(this, _SuggestionDropdown_selected, "f"));
                index--;
                if (index >= 0 && index < __classPrivateFieldGet(this, _SuggestionDropdown_suggestions, "f").childElementCount) {
                    __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_select).call(this, __classPrivateFieldGet(this, _SuggestionDropdown_suggestions, "f").children[index]);
                }
                break;
            }
        case "ArrowDown":
            {
                if (!__classPrivateFieldGet(this, _SuggestionDropdown_selected, "f"))
                    return;
                let index = Array.prototype.indexOf.call(__classPrivateFieldGet(this, _SuggestionDropdown_suggestions, "f").children, __classPrivateFieldGet(this, _SuggestionDropdown_selected, "f"));
                index++;
                if (index >= 0 && index < __classPrivateFieldGet(this, _SuggestionDropdown_suggestions, "f").childElementCount) {
                    __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_select).call(this, __classPrivateFieldGet(this, _SuggestionDropdown_suggestions, "f").children[index]);
                }
                break;
            }
        case "Backspace":
            if (this.target.value === "") {
                if (this.onEmptyBackspace) {
                    this.onEmptyBackspace();
                }
            }
            break;
        default:
            // new Notice(e.key)
            return;
    }
    event.stopPropagation();
}, _SuggestionDropdown_onKeyUp = function _SuggestionDropdown_onKeyUp(event) {
    switch (event.key) {
        case "Enter":
        case "Escape":
        case "ArrowRight":
        case "ArrowLeft":
        case "ArrowUp":
        case "ArrowDown":
        case "Backspace":
            break;
        default:
            // new Notice(e.key)
            return;
    }
    event.stopPropagation();
}, _SuggestionDropdown_submit = function _SuggestionDropdown_submit() {
    let result = this.target.value;
    this.target.value = "";
    if (__classPrivateFieldGet(this, _SuggestionDropdown_showing, "f") && __classPrivateFieldGet(this, _SuggestionDropdown_selected, "f")) {
        result = __classPrivateFieldGet(this, _SuggestionDropdown_selected, "f").textContent;
    }
    __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_cleanUp).call(this);
    if (this.onSubmit) {
        this.onSubmit(result);
    }
}, _SuggestionDropdown_updateSuggestions = async function _SuggestionDropdown_updateSuggestions(input) {
    if (input == __classPrivateFieldGet(this, _SuggestionDropdown_input, "f")) {
        return;
    }
    __classPrivateFieldGet(this, _SuggestionDropdown_suggestions, "f").empty();
    const items = await this.onGetItems();
    if (items.length == 0) {
        return;
    }
    input = input.toLowerCase();
    const matches = [];
    const fuzzySearch = obsidian.prepareFuzzySearch(input);
    for (let i = 0; i < items.length; i++) {
        if (this.ignoreList.contains(items[i])) {
            continue;
        }
        const result = fuzzySearch(items[i]);
        if (result) {
            matches.push([items[i], result.score]);
        }
    }
    if (matches.length == 0) {
        __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_select).call(this, null);
    }
    matches.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < matches.length; i++) {
        const item = __classPrivateFieldGet(this, _SuggestionDropdown_suggestions, "f").createDiv({ cls: "suggestion-item" });
        item.textContent = matches[i][0];
        item.addEventListener("mouseover", (e) => {
            __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_select).call(this, item);
        });
        item.addEventListener("mousedown", () => {
            __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_submit).call(this);
        });
    }
    __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_select).call(this, __classPrivateFieldGet(this, _SuggestionDropdown_suggestions, "f").children[0]);
}, _SuggestionDropdown_select = function _SuggestionDropdown_select(item) {
    if (__classPrivateFieldGet(this, _SuggestionDropdown_selected, "f")) {
        __classPrivateFieldGet(this, _SuggestionDropdown_selected, "f").removeClass("is-selected");
    }
    __classPrivateFieldSet(this, _SuggestionDropdown_selected, item, "f");
    if (item == null) {
        return;
    }
    item.addClass("is-selected");
}, _SuggestionDropdown_show = async function _SuggestionDropdown_show() {
    let top, left;
    [top, left] = this.getCoords();
    activeDocument.body.appendChild(__classPrivateFieldGet(this, _SuggestionDropdown_self, "f"));
    __classPrivateFieldGet(this, _SuggestionDropdown_self, "f").style.left = left + "px";
    __classPrivateFieldGet(this, _SuggestionDropdown_self, "f").style.top = top + "px";
    __classPrivateFieldSet(this, _SuggestionDropdown_showing, true, "f");
    if (__classPrivateFieldGet(this, _SuggestionDropdown_leftLocked, "f") || offScreenPartial(__classPrivateFieldGet(this, _SuggestionDropdown_self, "f"))) {
        __classPrivateFieldSet(this, _SuggestionDropdown_leftLocked, true, "f");
        const box = __classPrivateFieldGet(this, _SuggestionDropdown_self, "f").getBoundingClientRect();
        __classPrivateFieldGet(this, _SuggestionDropdown_self, "f").style.left = (left - box.width) + "px";
        __classPrivateFieldGet(this, _SuggestionDropdown_self, "f").style.top = (top - box.height) + "px";
    }
}, _SuggestionDropdown_cleanUp = function _SuggestionDropdown_cleanUp() {
    __classPrivateFieldGet(this, _SuggestionDropdown_instances, "m", _SuggestionDropdown_select).call(this, null);
    if (__classPrivateFieldGet(this, _SuggestionDropdown_self, "f")) {
        __classPrivateFieldGet(this, _SuggestionDropdown_self, "f").remove();
    }
    __classPrivateFieldSet(this, _SuggestionDropdown_leftLocked, false, "f");
    __classPrivateFieldSet(this, _SuggestionDropdown_showing, false, "f");
};

var _SuggestionPopup_info, _SuggestionPopup_original, _SuggestionPopup_complete;
class SuggestionPopup extends obsidian.Modal {
    constructor(app, info, original, getItems, onConfirm) {
        super(app);
        this.confirmLabel = loc('CONFIRM');
        this.cancelLabel = loc('CANCEL');
        _SuggestionPopup_info.set(this, void 0);
        _SuggestionPopup_original.set(this, void 0);
        _SuggestionPopup_complete.set(this, false);
        this.onConfirm = onConfirm;
        this.onGetItems = getItems;
        __classPrivateFieldSet(this, _SuggestionPopup_original, original, "f");
        __classPrivateFieldSet(this, _SuggestionPopup_info, info, "f");
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h1", { text: __classPrivateFieldGet(this, _SuggestionPopup_info, "f") });
        const setting = new obsidian.Setting(contentEl)
            .setDesc("")
            .addButton((btn) => {
            btn
                .setButtonText(this.confirmLabel)
                .setCta()
                .onClick(() => {
                this.close();
                __classPrivateFieldSet(this, _SuggestionPopup_complete, true, "f");
                if (this.onConfirm) {
                    this.onConfirm(input.value);
                }
            });
        })
            .addButton((btn) => {
            btn
                .setButtonText(this.cancelLabel)
                .setCta()
                .onClick(() => {
                this.close();
                __classPrivateFieldSet(this, _SuggestionPopup_complete, true, "f");
                if (this.onCancel) {
                    this.onCancel();
                }
            });
        });
        const input = setting.descEl.createEl("input", { cls: "new-tag-input" });
        input.value = __classPrivateFieldGet(this, _SuggestionPopup_original, "f");
        input.style.width = "100%";
        new SuggestionDropdown(input, this.onGetItems, async (s) => {
            this.close();
            if (this.onConfirm) {
                this.onConfirm(s);
            }
        });
    }
    onClose() {
        if (!__classPrivateFieldGet(this, _SuggestionPopup_complete, "f") && this.onCancel) {
            this.onCancel();
        }
        let { contentEl } = this;
        contentEl.empty();
    }
}
_SuggestionPopup_info = new WeakMap(), _SuggestionPopup_original = new WeakMap(), _SuggestionPopup_complete = new WeakMap();

var _MenuPopup_instances, _MenuPopup_onResult, _MenuPopup_self, _MenuPopup_optionsArea, _MenuPopup_selected, _MenuPopup_select, _MenuPopup_submit, _MenuPopup_cleanUp;
class MenuPopup {
    constructor(posX, posY, onResult) {
        _MenuPopup_instances.add(this);
        _MenuPopup_onResult.set(this, void 0);
        _MenuPopup_self.set(this, void 0);
        _MenuPopup_optionsArea.set(this, void 0);
        _MenuPopup_selected.set(this, void 0);
        __classPrivateFieldSet(this, _MenuPopup_onResult, onResult, "f");
        __classPrivateFieldSet(this, _MenuPopup_self, createDiv({ cls: "suggestion-container" }), "f");
        __classPrivateFieldSet(this, _MenuPopup_optionsArea, __classPrivateFieldGet(this, _MenuPopup_self, "f").createDiv("#suggestions-scroll"), "f");
        __classPrivateFieldGet(this, _MenuPopup_optionsArea, "f").style.width = "200px";
        __classPrivateFieldGet(this, _MenuPopup_optionsArea, "f").style.overflowY = "auto";
        __classPrivateFieldGet(this, _MenuPopup_self, "f").tabIndex = 0;
        __classPrivateFieldGet(this, _MenuPopup_self, "f").addEventListener("blur", async () => {
            // TODO: I hate every single one of these, cause it means I'm waiting on something and I don't know what
            await new Promise(f => setTimeout(f, 100));
            __classPrivateFieldGet(this, _MenuPopup_instances, "m", _MenuPopup_cleanUp).call(this);
        });
        __classPrivateFieldGet(this, _MenuPopup_self, "f").addEventListener("mouseleave", (e) => {
            __classPrivateFieldGet(this, _MenuPopup_instances, "m", _MenuPopup_cleanUp).call(this);
        });
    }
    AddLabel(label, color = null) {
        const info = __classPrivateFieldGet(this, _MenuPopup_optionsArea, "f").createDiv({ cls: "suggestion-item" });
        info.innerText = label;
        info.style.overflowWrap = "break-word";
        if (color) {
            info.style.color = color;
        }
    }
    addSeparator(color = null) {
        const line = __classPrivateFieldGet(this, _MenuPopup_optionsArea, "f").createDiv({ cls: "suggestion-item-separator" });
        if (color) {
            line.style.color = color;
        }
    }
    addItem(label, command, color = null) {
        const item = __classPrivateFieldGet(this, _MenuPopup_optionsArea, "f").createDiv({ cls: "suggestion-item" });
        item.textContent = label;
        item.dataset.href = command;
        item.style.overflowWrap = "break-word";
        item.addEventListener("mouseover", (e) => {
            __classPrivateFieldGet(this, _MenuPopup_instances, "m", _MenuPopup_select).call(this, item);
        });
        item.addEventListener("mousedown", () => {
            __classPrivateFieldGet(this, _MenuPopup_instances, "m", _MenuPopup_submit).call(this);
        });
        if (color) {
            item.style.color = color;
        }
    }
    show(posX, posY) {
        activeDocument.body.appendChild(__classPrivateFieldGet(this, _MenuPopup_self, "f"));
        __classPrivateFieldGet(this, _MenuPopup_self, "f").style.left = (posX) + "px";
        __classPrivateFieldGet(this, _MenuPopup_self, "f").style.top = (posY) + "px";
        const optionsRect = __classPrivateFieldGet(this, _MenuPopup_optionsArea, "f").getBoundingClientRect();
        __classPrivateFieldGet(this, _MenuPopup_self, "f").style.width = optionsRect.width + "px";
        if (offScreenPartial(__classPrivateFieldGet(this, _MenuPopup_self, "f"))) {
            let x, y;
            [x, y] = screenOffset(__classPrivateFieldGet(this, _MenuPopup_self, "f"));
            __classPrivateFieldGet(this, _MenuPopup_self, "f").style.left = (posX + x) + "px";
            __classPrivateFieldGet(this, _MenuPopup_self, "f").style.top = (posY + y) + "px";
        }
        __classPrivateFieldGet(this, _MenuPopup_self, "f").focus();
    }
}
_MenuPopup_onResult = new WeakMap(), _MenuPopup_self = new WeakMap(), _MenuPopup_optionsArea = new WeakMap(), _MenuPopup_selected = new WeakMap(), _MenuPopup_instances = new WeakSet(), _MenuPopup_select = function _MenuPopup_select(item) {
    if (__classPrivateFieldGet(this, _MenuPopup_selected, "f")) {
        __classPrivateFieldGet(this, _MenuPopup_selected, "f").removeClass("is-selected");
    }
    __classPrivateFieldSet(this, _MenuPopup_selected, item, "f");
    if (item == null) {
        return;
    }
    item.addClass("is-selected");
}, _MenuPopup_submit = function _MenuPopup_submit() {
    let result = null;
    if (__classPrivateFieldGet(this, _MenuPopup_selected, "f")) {
        result = __classPrivateFieldGet(this, _MenuPopup_selected, "f").dataset.href;
    }
    __classPrivateFieldGet(this, _MenuPopup_instances, "m", _MenuPopup_cleanUp).call(this);
    __classPrivateFieldGet(this, _MenuPopup_onResult, "f").call(this, result);
}, _MenuPopup_cleanUp = function _MenuPopup_cleanUp() {
    __classPrivateFieldGet(this, _MenuPopup_instances, "m", _MenuPopup_select).call(this, null);
    if (__classPrivateFieldGet(this, _MenuPopup_self, "f")) {
        __classPrivateFieldGet(this, _MenuPopup_self, "f").remove();
    }
};

var _ImageMenu_instances, _ImageMenu_plugin, _ImageMenu_mediaSearch, _ImageMenu_mediaGrid, _ImageMenu_infoView, _ImageMenu_targets, _ImageMenu_isRemote, _ImageMenu_createItem, _ImageMenu_submit, _ImageMenu_results, _ImageMenu_resultOpenImage, _ImageMenu_resultOpenMeta, _ImageMenu_resultOpenInfoLeaf, _ImageMenu_resultShareMedia, _ImageMenu_resultCopyImage, _ImageMenu_canConvertToPng, _ImageMenu_isVideoSupported, _ImageMenu_convertToPng, _ImageMenu_resultCopyImageLink, _ImageMenu_resultCopyImagesBlock, _ImageMenu_resultCopyMetaLink, _ImageMenu_resultAddTag, _ImageMenu_resultPullTags, _ImageMenu_resultRemoveTag, _ImageMenu_resultMoveImages, _ImageMenu_resultRenameImage, _ImageMenu_resultDeleteMeta, _ImageMenu_resultDeleteImage, _ImageMenu_refreshImageGrid, _ImageMenu_getPath, _ImageMenu_getSource;
var Options;
(function (Options) {
    Options[Options["Error"] = 0] = "Error";
    Options[Options["OpenImageFile"] = 1] = "OpenImageFile";
    Options[Options["OpenMetaFile"] = 2] = "OpenMetaFile";
    Options[Options["StartSelection"] = 3] = "StartSelection";
    Options[Options["EndSelection"] = 4] = "EndSelection";
    Options[Options["SelectAll"] = 5] = "SelectAll";
    Options[Options["ClearSelection"] = 6] = "ClearSelection";
    Options[Options["CopyImageLinks"] = 7] = "CopyImageLinks";
    Options[Options["CopyMetaLinks"] = 8] = "CopyMetaLinks";
    Options[Options["AddTag"] = 9] = "AddTag";
    Options[Options["PullMetaFromFile"] = 10] = "PullMetaFromFile";
    Options[Options["RemoveTag"] = 11] = "RemoveTag";
    Options[Options["MoveImages"] = 12] = "MoveImages";
    Options[Options["Rename"] = 13] = "Rename";
    Options[Options["DeleteImage"] = 14] = "DeleteImage";
    Options[Options["DeleteMeta"] = 15] = "DeleteMeta";
    Options[Options["CopyImage"] = 16] = "CopyImage";
    Options[Options["ShareMedia"] = 17] = "ShareMedia";
    Options[Options["OpenInfoLeaf"] = 18] = "OpenInfoLeaf";
    Options[Options["CopyImagesBlock"] = 19] = "CopyImagesBlock";
})(Options || (Options = {}));
class ImageMenu extends MenuPopup {
    constructor(posX, posY, targets, mediaSearch, mediaGrid, plugin, infoView = null) {
        super(posX, posY, (result) => { __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_submit).call(this, result); });
        _ImageMenu_instances.add(this);
        _ImageMenu_plugin.set(this, void 0);
        _ImageMenu_mediaSearch.set(this, void 0);
        _ImageMenu_mediaGrid.set(this, void 0);
        _ImageMenu_infoView.set(this, void 0);
        _ImageMenu_targets.set(this, void 0);
        _ImageMenu_isRemote.set(this, void 0);
        __classPrivateFieldSet(this, _ImageMenu_plugin, plugin, "f");
        __classPrivateFieldSet(this, _ImageMenu_mediaSearch, mediaSearch, "f");
        __classPrivateFieldSet(this, _ImageMenu_mediaGrid, mediaGrid, "f");
        __classPrivateFieldSet(this, _ImageMenu_infoView, infoView, "f");
        __classPrivateFieldSet(this, _ImageMenu_targets, targets, "f");
        if (__classPrivateFieldGet(this, _ImageMenu_targets, "f").length == 0) {
            this.AddLabel(loc('IMAGE_MENU_NOTHING'));
            this.addSeparator();
            if (__classPrivateFieldGet(this, _ImageMenu_mediaSearch, "f") && !obsidian.Platform.isDesktopApp) {
                __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, __classPrivateFieldGet(this, _ImageMenu_mediaSearch, "f").selectMode ? Options.EndSelection : Options.StartSelection);
            }
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.SelectAll);
        }
        else {
            if (__classPrivateFieldGet(this, _ImageMenu_targets, "f").length == 1) {
                let path = __classPrivateFieldGet(this, _ImageMenu_targets, "f")[0].src;
                if (isRemoteMedia(path)) {
                    __classPrivateFieldSet(this, _ImageMenu_isRemote, true, "f");
                }
                else {
                    __classPrivateFieldSet(this, _ImageMenu_isRemote, false, "f");
                    path = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[__classPrivateFieldGet(this, _ImageMenu_targets, "f")[0].src];
                }
                this.AddLabel(loc('IMAGE_MENU_SINGLE', path));
                this.addSeparator();
                if (!__classPrivateFieldGet(this, _ImageMenu_isRemote, "f")) {
                    __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.OpenImageFile);
                }
                if ((__classPrivateFieldGet(this, _ImageMenu_mediaSearch, "f") && !__classPrivateFieldGet(this, _ImageMenu_plugin, "f").platformSettings().rightClickInfoGallery)
                    || (!__classPrivateFieldGet(this, _ImageMenu_mediaSearch, "f") && !__classPrivateFieldGet(this, _ImageMenu_plugin, "f").platformSettings().rightClickInfo)) {
                    __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.OpenInfoLeaf);
                }
                __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.OpenMetaFile);
            }
            else {
                __classPrivateFieldSet(this, _ImageMenu_isRemote, false, "f");
                this.AddLabel(loc('IMAGE_MENU_COUNT', __classPrivateFieldGet(this, _ImageMenu_targets, "f").length.toString()));
                this.addSeparator();
                __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.ClearSelection);
            }
            if (__classPrivateFieldGet(this, _ImageMenu_mediaSearch, "f") && !obsidian.Platform.isDesktopApp) {
                __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, __classPrivateFieldGet(this, _ImageMenu_mediaSearch, "f").selectMode ? Options.EndSelection : Options.StartSelection);
            }
            if (__classPrivateFieldGet(this, _ImageMenu_mediaSearch, "f")) {
                __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.SelectAll);
            }
            this.addSeparator();
            if (__classPrivateFieldGet(this, _ImageMenu_targets, "f").length == 1 && !__classPrivateFieldGet(this, _ImageMenu_isRemote, "f")) {
                if (obsidian.Platform.isMobile) {
                    if (navigator.canShare) {
                        __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.ShareMedia);
                    }
                }
                if (__classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_canConvertToPng).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[0]) || __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_isVideoSupported).call(this)) {
                    __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.CopyImage);
                }
            }
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.CopyImageLinks);
            if (!__classPrivateFieldGet(this, _ImageMenu_isRemote, "f")) {
                __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.CopyImagesBlock);
            }
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.CopyMetaLinks);
            this.addSeparator();
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.AddTag);
            if (!__classPrivateFieldGet(this, _ImageMenu_isRemote, "f")) {
                __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.PullMetaFromFile);
            }
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.RemoveTag);
            if (!__classPrivateFieldGet(this, _ImageMenu_isRemote, "f")) {
                __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.MoveImages);
                if (__classPrivateFieldGet(this, _ImageMenu_targets, "f").length == 1) {
                    __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.Rename);
                }
            }
            this.addSeparator();
            if (!__classPrivateFieldGet(this, _ImageMenu_isRemote, "f")) {
                __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.DeleteImage);
            }
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_createItem).call(this, Options.DeleteMeta);
        }
        this.show(posX, posY);
    }
}
_ImageMenu_plugin = new WeakMap(), _ImageMenu_mediaSearch = new WeakMap(), _ImageMenu_mediaGrid = new WeakMap(), _ImageMenu_infoView = new WeakMap(), _ImageMenu_targets = new WeakMap(), _ImageMenu_isRemote = new WeakMap(), _ImageMenu_instances = new WeakSet(), _ImageMenu_createItem = function _ImageMenu_createItem(command) {
    //@ts-ignore
    const label = loc("IMAGE_MENU_COMMAND_" + command);
    let color = null;
    if (Options[command].contains("Delete")) {
        color = "#cc2222";
    }
    this.addItem(label, Options[command], color);
}, _ImageMenu_submit = function _ImageMenu_submit(responce) {
    const result = Options[responce];
    if (__classPrivateFieldGet(this, _ImageMenu_targets, "f").length < 50 ||
        (result == Options.StartSelection
            || result == Options.EndSelection
            || result == Options.SelectAll
            || result == Options.ClearSelection)) {
        __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_results).call(this, result);
        return;
    }
    //@ts-ignore
    const commandText = loc("IMAGE_MENU_COMMAND_" + result);
    const confirmText = loc('MASS_CONTEXT_CONFIRM', __classPrivateFieldGet(this, _ImageMenu_targets, "f").length.toString(), commandText);
    const confirm = new ConfirmModal(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").app, confirmText, () => { __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_results).call(this, result); });
    confirm.open();
}, _ImageMenu_results = function _ImageMenu_results(result) {
    switch (result) {
        case Options.OpenImageFile:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultOpenImage).call(this);
            break;
        case Options.OpenMetaFile:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultOpenMeta).call(this);
            break;
        case Options.StartSelection:
            __classPrivateFieldGet(this, _ImageMenu_mediaSearch, "f").selectMode = true;
            break;
        case Options.EndSelection:
            __classPrivateFieldGet(this, _ImageMenu_mediaSearch, "f").selectMode = false;
            break;
        case Options.SelectAll:
            __classPrivateFieldGet(this, _ImageMenu_mediaGrid, "f").selectAll();
            break;
        case Options.ClearSelection:
            __classPrivateFieldGet(this, _ImageMenu_mediaGrid, "f").clearSelection();
            break;
        case Options.CopyImageLinks:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultCopyImageLink).call(this);
            break;
        case Options.CopyMetaLinks:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultCopyMetaLink).call(this);
            break;
        case Options.AddTag:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultAddTag).call(this);
            break;
        case Options.PullMetaFromFile:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultPullTags).call(this);
            break;
        case Options.RemoveTag:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultRemoveTag).call(this);
            break;
        case Options.MoveImages:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultMoveImages).call(this);
            break;
        case Options.Rename:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultRenameImage).call(this);
            break;
        case Options.DeleteImage:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultDeleteImage).call(this);
            break;
        case Options.DeleteMeta:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultDeleteMeta).call(this);
            break;
        case Options.CopyImage:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultCopyImage).call(this);
            break;
        case Options.ShareMedia:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultShareMedia).call(this);
            break;
        case Options.OpenInfoLeaf:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultOpenInfoLeaf).call(this);
            break;
        case Options.CopyImagesBlock:
            __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_resultCopyImagesBlock).call(this);
            break;
        default:
            const error = loc('MENU_OPTION_FAULT', Options[result]);
            new obsidian.Notice(error);
            console.error(error);
    }
}, _ImageMenu_resultOpenImage = function _ImageMenu_resultOpenImage() {
    if (__classPrivateFieldGet(this, _ImageMenu_infoView, "f")) {
        __classPrivateFieldGet(this, _ImageMenu_infoView, "f").clear();
    }
    const source = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[0]);
    const file = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.getAbstractFileByPath(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[source]);
    if (file instanceof obsidian.TFile) {
        __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.workspace.getLeaf(false).openFile(file);
    }
}, _ImageMenu_resultOpenMeta = async function _ImageMenu_resultOpenMeta() {
    if (__classPrivateFieldGet(this, _ImageMenu_infoView, "f")) {
        __classPrivateFieldGet(this, _ImageMenu_infoView, "f").clear();
    }
    const source = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[0]);
    const infoFile = await getImageInfo(__classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getPath).call(this, source), true, __classPrivateFieldGet(this, _ImageMenu_plugin, "f"));
    if (infoFile instanceof obsidian.TFile) {
        __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.workspace.getLeaf(false).openFile(infoFile);
    }
}, _ImageMenu_resultOpenInfoLeaf = async function _ImageMenu_resultOpenInfoLeaf() {
    if (__classPrivateFieldGet(this, _ImageMenu_infoView, "f")) {
        __classPrivateFieldGet(this, _ImageMenu_infoView, "f").clear();
    }
    const source = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[0]);
    await GalleryInfoView.OpenLeaf(__classPrivateFieldGet(this, _ImageMenu_plugin, "f"), source);
}, _ImageMenu_resultShareMedia = async function _ImageMenu_resultShareMedia() {
    if (__classPrivateFieldGet(this, _ImageMenu_infoView, "f")) {
        __classPrivateFieldGet(this, _ImageMenu_infoView, "f").clear();
    }
    const imgFile = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.getAbstractFileByPath(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[__classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[0])]);
    const result = await fetch(__classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[0]));
    const blob = await result.blob();
    if (navigator.canShare) {
        const shareData = {};
        shareData.title = blob.name;
        const file = {
            lastModified: imgFile.stat.mtime,
            webkitRelativePath: '/',
            size: blob.size,
            type: blob.type,
            name: blob.name,
            arrayBuffer: blob.arrayBuffer,
            slice: blob.slice,
            stream: blob.stream,
            text: blob.text,
            prototype: blob.prototype
        };
        shareData.files = [file];
        if (navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            }
            catch (e) {
                new obsidian.Notice(typeof (e));
                console.error(e);
            }
        }
        else {
            new obsidian.Notice(loc('CAN_NOT_SHARE'));
        }
    }
}, _ImageMenu_resultCopyImage = async function _ImageMenu_resultCopyImage() {
    if (__classPrivateFieldGet(this, _ImageMenu_infoView, "f")) {
        __classPrivateFieldGet(this, _ImageMenu_infoView, "f").clear();
    }
    if (__classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_canConvertToPng).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[0])) {
        const blob = await __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_convertToPng).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[0]);
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        new obsidian.Notice(loc('COPIED_MEDIA'));
    }
    else {
        let path = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[__classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[0])];
        //@ts-ignore
        path = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.adapter.getFullRealPath(path);
        let command = null;
        if (obsidian.Platform.isWin) {
            path = path.replaceAll(' ', '\ ');
            command = `powershell Set-Clipboard -Path '${path}'`;
        }
        if (obsidian.Platform.isMacOS) {
            command = `pbcopy < "${path}"`;
        }
        if (obsidian.Platform.isLinux) {
            const result = await fetch(__classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[0]));
            const blob = await result.blob();
            command = `xclip -selection clipboard -t ${blob.type} -o > "${path}""`;
        }
        // TODO: try to find an android solution? maybe on android we should have a share option instead? oh shit, that actually makes more sense...
        if (command == null) {
            new obsidian.Notice(loc('PLATFORM_COPY_NOT_SUPPORTED'));
        }
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(stderr);
                new obsidian.Notice(loc("PLATFORM_EXEC_FAILURE"));
            }
            else {
                new obsidian.Notice(loc('COPIED_MEDIA'));
            }
        });
    }
}, _ImageMenu_canConvertToPng = function _ImageMenu_canConvertToPng(image) {
    if (image instanceof HTMLVideoElement) {
        return false;
    }
    const src = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[0]);
    if (src.match(CONVERSION_SUPPORT)) {
        return true;
    }
    return false;
}, _ImageMenu_isVideoSupported = function _ImageMenu_isVideoSupported() {
    if (obsidian.Platform.isWin
        || obsidian.Platform.isMacOS
        || obsidian.Platform.isLinux) {
        return true;
    }
    return false;
}, _ImageMenu_convertToPng = function _ImageMenu_convertToPng(image) {
    return new Promise((result) => {
        const canvas = createEl('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        ctx.drawImage(image, 0, 0);
        canvas.toBlob((blob) => { result(blob); }, 'image/png');
    });
}, _ImageMenu_resultCopyImageLink = async function _ImageMenu_resultCopyImageLink() {
    if (__classPrivateFieldGet(this, _ImageMenu_infoView, "f")) {
        __classPrivateFieldGet(this, _ImageMenu_infoView, "f").clear();
    }
    let links = "";
    for (let i = 0; i < __classPrivateFieldGet(this, _ImageMenu_targets, "f").length; i++) {
        const source = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[i]);
        const file = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.getAbstractFileByPath(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[source]);
        if (file instanceof obsidian.TFile) {
            links += `![${file.basename}](${preprocessUri(file.path)})\n`;
        }
        else if (validString(source)) {
            const name = source.substring(source.lastIndexOf("/") + 1);
            links += `![${name}](${source})\n`;
        }
    }
    await navigator.clipboard.writeText(links);
    new obsidian.Notice(loc('COPIED_LINKS'));
}, _ImageMenu_resultCopyImagesBlock = async function _ImageMenu_resultCopyImagesBlock() {
    if (__classPrivateFieldGet(this, _ImageMenu_infoView, "f")) {
        __classPrivateFieldGet(this, _ImageMenu_infoView, "f").clear();
    }
    let names = "";
    for (let i = 0; i < __classPrivateFieldGet(this, _ImageMenu_targets, "f").length; i++) {
        const source = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[i]);
        const file = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.getAbstractFileByPath(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[source]);
        if (file instanceof obsidian.TFile) {
            names += `${file.basename},`;
        }
    }
    let filter = __classPrivateFieldGet(this, _ImageMenu_mediaSearch, "f").getFilter();
    let result = filter.substring(0, filter.indexOf("name:"));
    result += "name:" + names;
    result += filter.substring(filter.indexOf("\n", filter.indexOf("name:")));
    await navigator.clipboard.writeText(result);
    new obsidian.Notice(loc('COPIED_FILTER'));
}, _ImageMenu_resultCopyMetaLink = async function _ImageMenu_resultCopyMetaLink() {
    if (__classPrivateFieldGet(this, _ImageMenu_infoView, "f")) {
        __classPrivateFieldGet(this, _ImageMenu_infoView, "f").clear();
    }
    let links = "";
    let cancel = false;
    const progress = new ProgressModal(__classPrivateFieldGet(this, _ImageMenu_plugin, "f"), __classPrivateFieldGet(this, _ImageMenu_targets, "f").length, () => { cancel = true; });
    progress.open();
    for (let i = 0; i < __classPrivateFieldGet(this, _ImageMenu_targets, "f").length; i++) {
        if (cancel) {
            new obsidian.Notice(loc('GENERIC_CANCELED'));
            return;
        }
        progress.updateProgress(i);
        const source = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[i]);
        const infoFile = await getImageInfo(__classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getPath).call(this, source), true, __classPrivateFieldGet(this, _ImageMenu_plugin, "f"));
        if (infoFile) {
            links += `[${infoFile.basename}](${preprocessUri(infoFile.path)})\n`;
        }
    }
    await navigator.clipboard.writeText(links);
    new obsidian.Notice(loc('COPIED_LINKS'));
}, _ImageMenu_resultAddTag = function _ImageMenu_resultAddTag() {
    const fuzzyTags = new FuzzyTags(__classPrivateFieldGet(this, _ImageMenu_plugin, "f"));
    fuzzyTags.onSelection = async (s) => {
        const tag = s.trim();
        if (!validString(tag)) {
            return;
        }
        let cancel = false;
        const progress = new ProgressModal(__classPrivateFieldGet(this, _ImageMenu_plugin, "f"), __classPrivateFieldGet(this, _ImageMenu_targets, "f").length, () => { cancel = true; });
        progress.open();
        for (let i = 0; i < __classPrivateFieldGet(this, _ImageMenu_targets, "f").length; i++) {
            if (cancel) {
                new obsidian.Notice(loc('GENERIC_CANCELED'));
                return;
            }
            progress.updateProgress(i);
            const source = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[i]);
            const infoFile = await getImageInfo(__classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getPath).call(this, source), true, __classPrivateFieldGet(this, _ImageMenu_plugin, "f"));
            addTag(infoFile, tag, __classPrivateFieldGet(this, _ImageMenu_plugin, "f"));
        }
        new obsidian.Notice(loc('ADDED_TAG'));
    };
    fuzzyTags.open();
}, _ImageMenu_resultPullTags = async function _ImageMenu_resultPullTags() {
    const promises = [];
    let cancel = false;
    const progress = new ProgressModal(__classPrivateFieldGet(this, _ImageMenu_plugin, "f"), __classPrivateFieldGet(this, _ImageMenu_targets, "f").length + 1, () => { cancel = true; });
    progress.open();
    for (let i = 0; i < __classPrivateFieldGet(this, _ImageMenu_targets, "f").length; i++) {
        if (cancel) {
            new obsidian.Notice(loc('GENERIC_CANCELED'));
            return;
        }
        progress.updateProgress(i);
        const source = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[i]);
        const file = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.getAbstractFileByPath(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[source]);
        let infoFile = await getImageInfo(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[source], false, __classPrivateFieldGet(this, _ImageMenu_plugin, "f"));
        if (!(file instanceof obsidian.TFile)) {
            continue;
        }
        if (infoFile) {
            __classPrivateFieldGet(this, _ImageMenu_plugin, "f").getMetaResources()[file.path] = infoFile.path;
            promises.push(addEmbededTags(file, infoFile, __classPrivateFieldGet(this, _ImageMenu_plugin, "f")));
        }
        else {
            infoFile = await createMetaFile(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[source], __classPrivateFieldGet(this, _ImageMenu_plugin, "f"));
            if (infoFile) {
                __classPrivateFieldGet(this, _ImageMenu_plugin, "f").getMetaResources()[file.path] = infoFile.path;
            }
        }
    }
    await Promise.all(promises);
    progress.updateProgress(__classPrivateFieldGet(this, _ImageMenu_targets, "f").length);
    new obsidian.Notice(loc('ADDED_TAG'));
}, _ImageMenu_resultRemoveTag = function _ImageMenu_resultRemoveTag() {
    const fuzzyTags = new FuzzyTags(__classPrivateFieldGet(this, _ImageMenu_plugin, "f"));
    fuzzyTags.onSelection = async (s) => {
        const tag = s.trim();
        if (!validString(tag)) {
            return;
        }
        let cancel = false;
        const progress = new ProgressModal(__classPrivateFieldGet(this, _ImageMenu_plugin, "f"), __classPrivateFieldGet(this, _ImageMenu_targets, "f").length, () => { cancel = true; });
        progress.open();
        for (let i = 0; i < __classPrivateFieldGet(this, _ImageMenu_targets, "f").length; i++) {
            if (cancel) {
                new obsidian.Notice(loc('GENERIC_CANCELED'));
                return;
            }
            progress.updateProgress(i);
            const source = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[i]);
            const infoFile = await getImageInfo(__classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getPath).call(this, source), true, __classPrivateFieldGet(this, _ImageMenu_plugin, "f"));
            removeTag(infoFile, tag, __classPrivateFieldGet(this, _ImageMenu_plugin, "f"));
        }
        new obsidian.Notice(loc('REMOVED_TAG'));
    };
    fuzzyTags.open();
}, _ImageMenu_resultMoveImages = function _ImageMenu_resultMoveImages() {
    const fuzzyFolders = new FuzzyFolders(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").app);
    fuzzyFolders.onSelection = async (s) => {
        let cancel = false;
        const progress = new ProgressModal(__classPrivateFieldGet(this, _ImageMenu_plugin, "f"), __classPrivateFieldGet(this, _ImageMenu_targets, "f").length, () => { cancel = true; });
        progress.open();
        for (let i = 0; i < __classPrivateFieldGet(this, _ImageMenu_targets, "f").length; i++) {
            if (cancel) {
                new obsidian.Notice(loc('GENERIC_CANCELED'));
                return;
            }
            progress.updateProgress(i);
            const source = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[i]);
            const file = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.getAbstractFileByPath(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[source]);
            if (file) {
                const newPath = s + "/" + file.name;
                delete __classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[source];
                await __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.fileManager.renameFile(file, newPath);
            }
        }
        new obsidian.Notice(loc('MOVED_IMAGE'));
        await __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_refreshImageGrid).call(this);
    };
    fuzzyFolders.open();
}, _ImageMenu_resultRenameImage = function _ImageMenu_resultRenameImage() {
    if (__classPrivateFieldGet(this, _ImageMenu_targets, "f").length != 1) {
        return;
    }
    const original = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[__classPrivateFieldGet(this, _ImageMenu_targets, "f")[0].src];
    const suggesion = new SuggestionPopup(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").app, loc("PROMPT_FOR_NEW_NAME"), original, () => {
        const files = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.getAllLoadedFiles();
        const filtered = files.filter((f) => (f instanceof obsidian.TFile));
        return filtered.map((f) => f.path);
    }, async (newName) => {
        const file = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.getAbstractFileByPath(original);
        if (!newName.contains(file.extension)) {
            newName += file.extension;
        }
        const conflict = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.getAbstractFileByPath(newName);
        if (conflict) {
            new obsidian.Notice(loc('CONFLICT_NOTICE_PATH', newName));
            return;
        }
        if (file) {
            delete __classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[__classPrivateFieldGet(this, _ImageMenu_targets, "f")[0].src];
            await __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.fileManager.renameFile(file, newName);
        }
        new obsidian.Notice(loc('MOVED_IMAGE'));
        await __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_refreshImageGrid).call(this);
    });
    suggesion.open();
}, _ImageMenu_resultDeleteMeta = async function _ImageMenu_resultDeleteMeta() {
    if (__classPrivateFieldGet(this, _ImageMenu_infoView, "f")) {
        __classPrivateFieldGet(this, _ImageMenu_infoView, "f").clear();
    }
    let cancel = false;
    const progress = new ProgressModal(__classPrivateFieldGet(this, _ImageMenu_plugin, "f"), __classPrivateFieldGet(this, _ImageMenu_targets, "f").length, () => { cancel = true; });
    progress.open();
    for (let i = 0; i < __classPrivateFieldGet(this, _ImageMenu_targets, "f").length; i++) {
        if (cancel) {
            new obsidian.Notice(loc('GENERIC_CANCELED'));
            return;
        }
        progress.updateProgress(i);
        const source = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[i]);
        const infoFile = await getImageInfo(__classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getPath).call(this, source), false, __classPrivateFieldGet(this, _ImageMenu_plugin, "f"));
        if (infoFile) {
            await __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.delete(infoFile);
        }
    }
    new obsidian.Notice(loc('DELETED_META'));
}, _ImageMenu_resultDeleteImage = async function _ImageMenu_resultDeleteImage() {
    if (__classPrivateFieldGet(this, _ImageMenu_infoView, "f")) {
        __classPrivateFieldGet(this, _ImageMenu_infoView, "f").clear();
    }
    let cancel = false;
    const progress = new ProgressModal(__classPrivateFieldGet(this, _ImageMenu_plugin, "f"), __classPrivateFieldGet(this, _ImageMenu_targets, "f").length, () => { cancel = true; });
    progress.open();
    for (let i = 0; i < __classPrivateFieldGet(this, _ImageMenu_targets, "f").length; i++) {
        if (cancel) {
            new obsidian.Notice(loc('GENERIC_CANCELED'));
            return;
        }
        progress.updateProgress(i);
        const source = __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_getSource).call(this, __classPrivateFieldGet(this, _ImageMenu_targets, "f")[i]);
        const file = __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.getAbstractFileByPath(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[source]);
        const infoFile = await getImageInfo(__classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[source], false, __classPrivateFieldGet(this, _ImageMenu_plugin, "f"));
        if (file) {
            await __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.delete(file);
            delete __classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[source];
        }
        if (infoFile) {
            __classPrivateFieldGet(this, _ImageMenu_plugin, "f").app.vault.delete(infoFile);
        }
    }
    new obsidian.Notice(loc('DELETED_IMAGE'));
    await __classPrivateFieldGet(this, _ImageMenu_instances, "m", _ImageMenu_refreshImageGrid).call(this);
}, _ImageMenu_refreshImageGrid = async function _ImageMenu_refreshImageGrid() {
    if (!__classPrivateFieldGet(this, _ImageMenu_mediaSearch, "f")) {
        return;
    }
    // TODO: I hate every single one of these, cause it means I'm waiting on something and I don't know what
    await new Promise(f => setTimeout(f, 100));
    await __classPrivateFieldGet(this, _ImageMenu_mediaSearch, "f").updateData();
    await __classPrivateFieldGet(this, _ImageMenu_mediaGrid, "f").updateDisplay();
}, _ImageMenu_getPath = function _ImageMenu_getPath(source) {
    if (__classPrivateFieldGet(this, _ImageMenu_isRemote, "f")) {
        return source;
    }
    return __classPrivateFieldGet(this, _ImageMenu_plugin, "f").getImgResources()[source];
}, _ImageMenu_getSource = function _ImageMenu_getSource(target) {
    if (target.dataset.src) {
        return target.dataset.src;
    }
    return target.src;
};

var _MediaGrid_instances, _MediaGrid_tempImg, _MediaGrid_oldWidth, _MediaGrid_columnEls, _MediaGrid_imgFocusIndex, _MediaGrid_pausedVideo, _MediaGrid_pausedVideoUrl, _MediaGrid_selectElement, _MediaGrid_resize;
class MediaGrid {
    constructor(parent, mediaSearch, plugin) {
        _MediaGrid_instances.add(this);
        _MediaGrid_tempImg.set(this, void 0);
        _MediaGrid_oldWidth.set(this, 0);
        _MediaGrid_columnEls.set(this, []);
        _MediaGrid_imgFocusIndex.set(this, void 0);
        _MediaGrid_pausedVideo.set(this, void 0);
        _MediaGrid_pausedVideoUrl.set(this, '');
        this.plugin = plugin;
        this.mediaSearch = mediaSearch;
        this.displayEl = parent;
        this.columnContainer = this.displayEl.createEl('ul');
        __classPrivateFieldSet(this, _MediaGrid_tempImg, GALLERY_LOADING_IMAGE, "f");
    }
    haveColumnsChanged() {
        const columnCount = Math.ceil(this.areaWidth() / this.mediaSearch.maxWidth);
        const result = columnCount != __classPrivateFieldGet(this, _MediaGrid_columnEls, "f").length;
        if (result) {
            this.mediaSearch.redraw = true;
        }
        return result;
    }
    areaWidth() {
        return this.columnContainer.offsetWidth;
    }
    async updateDisplay() {
        if (this.areaWidth() <= 0) {
            return;
        }
        if (!this.mediaSearch.redraw
            && this.areaWidth() >= __classPrivateFieldGet(this, _MediaGrid_oldWidth, "f")
            && this.areaWidth() - __classPrivateFieldGet(this, _MediaGrid_oldWidth, "f") < 20) {
            return;
        }
        __classPrivateFieldSet(this, _MediaGrid_oldWidth, this.areaWidth(), "f");
        if (!this.mediaSearch.redraw && !this.haveColumnsChanged()) {
            __classPrivateFieldGet(this, _MediaGrid_instances, "m", _MediaGrid_resize).call(this);
            return;
        }
        const scrollPosition = this.displayEl.scrollTop;
        this.columnContainer.empty();
        __classPrivateFieldSet(this, _MediaGrid_columnEls, [], "f");
        const columnCount = Math.ceil(this.areaWidth() / this.mediaSearch.maxWidth);
        const columnWidth = (this.areaWidth() - 55) / columnCount;
        for (let col = 0; col < columnCount; col++) {
            __classPrivateFieldGet(this, _MediaGrid_columnEls, "f").push(this.columnContainer.createDiv({ cls: 'gallery-grid-column' }));
            __classPrivateFieldGet(this, _MediaGrid_columnEls, "f")[col].style.width = columnWidth + "px";
        }
        const selection = [];
        if (this.mediaSearch.selectedEls && this.mediaSearch.selectedEls.length > 0) {
            for (let i = 0; i < this.mediaSearch.selectedEls.length; i++) {
                selection.push(this.mediaSearch.selectedEls[i].src);
            }
            this.mediaSearch.selectedEls = [];
        }
        let index = 0;
        while (index < this.mediaSearch.imgList.length) {
            for (let col = 0; col < __classPrivateFieldGet(this, _MediaGrid_columnEls, "f").length; col++) {
                if (index >= this.mediaSearch.imgList.length) {
                    break;
                }
                let source = this.mediaSearch.imgList[index];
                let visualEl;
                index++;
                if (source.match(VIDEO_REGEX)) {
                    const vid = __classPrivateFieldGet(this, _MediaGrid_columnEls, "f")[col].createEl("video");
                    vid.src = source;
                    vid.classList.add("gallery-grid-vid");
                    vid.controls = true;
                    visualEl = vid;
                }
                else {
                    const img = __classPrivateFieldGet(this, _MediaGrid_columnEls, "f")[col].createEl("img");
                    img.src = __classPrivateFieldGet(this, _MediaGrid_tempImg, "f");
                    img.classList.add("gallery-grid-img");
                    img.classList.add("lazy");
                    img.loading = "lazy";
                    img.alt = source;
                    img.dataset.src = source;
                    visualEl = img;
                }
                if (this.mediaSearch.maxHeight > 10) {
                    visualEl.style.maxHeight = this.mediaSearch.maxHeight + "px";
                }
                // Multiselect code
                if (selection.contains(source)) {
                    this.mediaSearch.selectedEls.push(visualEl);
                    visualEl.addClass("selected-item");
                }
            }
        }
        this.mediaSearch.redraw = false;
        setLazyLoading();
        this.displayEl.scrollTop = scrollPosition;
        await new Promise(f => setTimeout(f, 100));
        this.displayEl.scrollTop = scrollPosition;
    }
    setupClickEvents() {
        // Create gallery display Element		
        this.imageFocusEl = this.displayEl.createDiv({ cls: 'ob-gallery-image-focus', attr: { style: 'display: none;' } });
        const focusElContainer = this.imageFocusEl.createDiv({ attr: { class: 'focus-element-container' } });
        this.focusImage = focusElContainer.createEl('img', { attr: { style: 'display: none;' } });
        this.focusVideo = focusElContainer.createEl('video', { attr: { controls: 'controls', src: ' ', style: 'display: none; margin:auto;' } });
        if ('ontouchstart' in document.documentElement === true) {
            this.displayEl.addEventListener('touchstart', (e) => { this.vidTouch(e); }, true);
        }
        this.displayEl.addEventListener('click', (e) => { this.itemClick(e); });
        this.displayEl.addEventListener('auxclick', this.plugin.auxClick.bind(this.plugin));
        this.displayEl.addEventListener('contextmenu', async (e) => {
            if (this.mediaSearch.selectedEls.length == 0 && (e.target instanceof HTMLImageElement || e.target instanceof HTMLVideoElement)) {
                new ImageMenu(e.pageX, e.pageY, [e.target], this.mediaSearch, this, this.plugin);
            }
            else {
                new ImageMenu(e.pageX, e.pageY, this.mediaSearch.selectedEls, this.mediaSearch, this, this.plugin);
            }
        });
        const focusShift = async () => {
            if (__classPrivateFieldGet(this, _MediaGrid_imgFocusIndex, "f") < 0) {
                __classPrivateFieldSet(this, _MediaGrid_imgFocusIndex, this.mediaSearch.imgList.length - 1, "f");
            }
            if (__classPrivateFieldGet(this, _MediaGrid_imgFocusIndex, "f") >= this.mediaSearch.imgList.length) {
                __classPrivateFieldSet(this, _MediaGrid_imgFocusIndex, 0, "f");
            }
            if (this.mediaSearch.imgList[__classPrivateFieldGet(this, _MediaGrid_imgFocusIndex, "f")].match(VIDEO_REGEX)) {
                updateFocus(this.focusImage, this.focusVideo, this.mediaSearch.imgList[__classPrivateFieldGet(this, _MediaGrid_imgFocusIndex, "f")], true);
            }
            else {
                updateFocus(this.focusImage, this.focusVideo, this.mediaSearch.imgList[__classPrivateFieldGet(this, _MediaGrid_imgFocusIndex, "f")], false);
            }
            if (this.plugin.platformSettings().rightClickInfoGallery) {
                if (this.infoView) {
                    await this.infoView.updateInfoDisplay(this.plugin.getImgResources()[this.mediaSearch.imgList[__classPrivateFieldGet(this, _MediaGrid_imgFocusIndex, "f")]]);
                }
                else {
                    this.infoView = await GalleryInfoView.OpenLeaf(this.plugin, this.plugin.getImgResources()[this.mediaSearch.imgList[__classPrivateFieldGet(this, _MediaGrid_imgFocusIndex, "f")]]);
                }
            }
        };
        document.addEventListener('keydown', async (event) => {
            // Mobile clicks don't seem to include shift key information
            if (event.shiftKey) {
                this.mediaSearch.selectMode = true;
            }
        }, false);
        document.addEventListener('keyup', async (event) => {
            var _a, _b;
            if (this.mediaSearch.selectMode && !event.shiftKey) {
                this.mediaSearch.selectMode = false;
            }
            if (this.imageFocusEl.style.getPropertyValue('display') != 'block') {
                return;
            }
            if (this.infoView && this.infoView.sourceEl.style.getPropertyValue('display') === 'block') {
                return;
            }
            switch (event.key) {
                case 'ArrowLeft':
                    __classPrivateFieldSet(this, _MediaGrid_imgFocusIndex, (_a = __classPrivateFieldGet(this, _MediaGrid_imgFocusIndex, "f"), _a--, _a), "f");
                    await focusShift();
                    break;
                case 'ArrowRight':
                    __classPrivateFieldSet(this, _MediaGrid_imgFocusIndex, (_b = __classPrivateFieldGet(this, _MediaGrid_imgFocusIndex, "f"), _b++, _b), "f");
                    await focusShift();
                    break;
            }
        }, false);
    }
    async itemClick(evt) {
        if (this.imageFocusEl.style.getPropertyValue('display') === 'block') {
            this.imageFocusEl.style.setProperty('display', 'none');
            // Clear Focus video
            this.focusVideo.src = '';
            // Clear Focus image
            this.focusImage.src = '';
            // Set Video Url back to disabled grid video
            if (__classPrivateFieldGet(this, _MediaGrid_pausedVideo, "f")) {
                __classPrivateFieldGet(this, _MediaGrid_pausedVideo, "f").src = __classPrivateFieldGet(this, _MediaGrid_pausedVideoUrl, "f");
            }
            // Hide focus image div
            this.focusImage.style.setProperty('display', 'none');
            // Hide focus video div
            this.focusVideo.style.setProperty('display', 'none');
            return;
        }
        evt.stopImmediatePropagation();
        let visualEl;
        if (evt.target instanceof HTMLVideoElement || evt.target instanceof HTMLImageElement) {
            visualEl = evt.target;
        }
        else {
            return;
        }
        if (this.plugin.platformSettings().rightClickInfoGallery) {
            if (this.infoView) {
                await this.infoView.updateInfoDisplay(this.plugin.getImgResources()[visualEl.src]);
            }
            else {
                this.infoView = await GalleryInfoView.OpenLeaf(this.plugin, this.plugin.getImgResources()[visualEl.src]);
            }
        }
        if (obsidian.Keymap.isModifier(evt, 'Shift') || this.mediaSearch.selectMode) {
            if (!visualEl.classList.contains("gallery-grid-vid") && !visualEl.classList.contains("gallery-grid-img")) {
                return;
            }
            evt.stopImmediatePropagation();
            __classPrivateFieldGet(this, _MediaGrid_instances, "m", _MediaGrid_selectElement).call(this, visualEl);
            return;
        }
        if (visualEl instanceof HTMLImageElement) {
            // Read New image info
            const focusImagePath = visualEl.src;
            __classPrivateFieldSet(this, _MediaGrid_imgFocusIndex, this.mediaSearch.imgList.indexOf(focusImagePath), "f");
            this.imageFocusEl.style.setProperty('display', 'block');
            updateFocus(this.focusImage, this.focusVideo, this.mediaSearch.imgList[__classPrivateFieldGet(this, _MediaGrid_imgFocusIndex, "f")], false);
        }
        if (visualEl instanceof HTMLVideoElement) {
            // Read video info
            const focusImagePath = visualEl.src;
            __classPrivateFieldSet(this, _MediaGrid_imgFocusIndex, this.mediaSearch.imgList.indexOf(focusImagePath), "f");
            this.imageFocusEl.style.setProperty('display', 'block');
            // Save clicked video info to set it back later
            __classPrivateFieldSet(this, _MediaGrid_pausedVideo, visualEl, "f");
            __classPrivateFieldSet(this, _MediaGrid_pausedVideoUrl, __classPrivateFieldGet(this, _MediaGrid_pausedVideo, "f").src, "f");
            // disable clicked video
            __classPrivateFieldGet(this, _MediaGrid_pausedVideo, "f").src = '';
            updateFocus(this.focusImage, this.focusVideo, this.mediaSearch.imgList[__classPrivateFieldGet(this, _MediaGrid_imgFocusIndex, "f")], true);
        }
    }
    async vidTouch(evt) {
        if (evt.target instanceof HTMLVideoElement) {
            this.itemClick(evt);
        }
    }
    selectAll() {
        this.mediaSearch.selectedEls = [];
        for (let col = 0; col < __classPrivateFieldGet(this, _MediaGrid_columnEls, "f").length; col++) {
            const column = __classPrivateFieldGet(this, _MediaGrid_columnEls, "f")[col];
            for (let index = 0; index < column.childElementCount; index++) {
                __classPrivateFieldGet(this, _MediaGrid_instances, "m", _MediaGrid_selectElement).call(this, column.children[index]);
            }
        }
    }
    clearSelection() {
        if (this.mediaSearch.selectedEls && this.mediaSearch.selectedEls.length > 0) {
            for (let i = 0; i < this.mediaSearch.selectedEls.length; i++) {
                this.mediaSearch.selectedEls[i].removeClass("selected-item");
            }
            this.mediaSearch.selectedEls = [];
        }
    }
}
_MediaGrid_tempImg = new WeakMap(), _MediaGrid_oldWidth = new WeakMap(), _MediaGrid_columnEls = new WeakMap(), _MediaGrid_imgFocusIndex = new WeakMap(), _MediaGrid_pausedVideo = new WeakMap(), _MediaGrid_pausedVideoUrl = new WeakMap(), _MediaGrid_instances = new WeakSet(), _MediaGrid_selectElement = function _MediaGrid_selectElement(visualEl) {
    if (this.mediaSearch.selectedEls.contains(visualEl)) {
        this.mediaSearch.selectedEls.remove(visualEl);
        visualEl.removeClass("selected-item");
    }
    else {
        this.mediaSearch.selectedEls.push(visualEl);
        visualEl.addClass("selected-item");
    }
}, _MediaGrid_resize = function _MediaGrid_resize() {
    const columnWidth = (this.areaWidth() - 55) / __classPrivateFieldGet(this, _MediaGrid_columnEls, "f").length;
    for (let col = 0; col < __classPrivateFieldGet(this, _MediaGrid_columnEls, "f").length; col++) {
        __classPrivateFieldGet(this, _MediaGrid_columnEls, "f")[col].style.width = columnWidth + "px";
    }
};

/** @returns {void} */
function noop() {}

/**
 * @template T
 * @template S
 * @param {T} tar
 * @param {S} src
 * @returns {T & S}
 */
function assign(tar, src) {
	// @ts-ignore
	for (const k in src) tar[k] = src[k];
	return /** @type {T & S} */ (tar);
}

function run(fn) {
	return fn();
}

function blank_object() {
	return Object.create(null);
}

/**
 * @param {Function[]} fns
 * @returns {void}
 */
function run_all(fns) {
	fns.forEach(run);
}

/**
 * @param {any} thing
 * @returns {thing is Function}
 */
function is_function(thing) {
	return typeof thing === 'function';
}

/** @returns {boolean} */
function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}

/** @returns {boolean} */
function is_empty(obj) {
	return Object.keys(obj).length === 0;
}

function create_slot(definition, ctx, $$scope, fn) {
	if (definition) {
		const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
		return definition[0](slot_ctx);
	}
}

function get_slot_context(definition, ctx, $$scope, fn) {
	return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
}

function get_slot_changes(definition, $$scope, dirty, fn) {
	if (definition[2] && fn) {
		const lets = definition[2](fn(dirty));
		if ($$scope.dirty === undefined) {
			return lets;
		}
		if (typeof lets === 'object') {
			const merged = [];
			const len = Math.max($$scope.dirty.length, lets.length);
			for (let i = 0; i < len; i += 1) {
				merged[i] = $$scope.dirty[i] | lets[i];
			}
			return merged;
		}
		return $$scope.dirty | lets;
	}
	return $$scope.dirty;
}

/** @returns {void} */
function update_slot_base(
	slot,
	slot_definition,
	ctx,
	$$scope,
	slot_changes,
	get_slot_context_fn
) {
	if (slot_changes) {
		const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
		slot.p(slot_context, slot_changes);
	}
}

/** @returns {any[] | -1} */
function get_all_dirty_from_scope($$scope) {
	if ($$scope.ctx.length > 32) {
		const dirty = [];
		const length = $$scope.ctx.length / 32;
		for (let i = 0; i < length; i++) {
			dirty[i] = -1;
		}
		return dirty;
	}
	return -1;
}

/**
 * @param {Node} target
 * @param {Node} node
 * @returns {void}
 */
function append(target, node) {
	target.appendChild(node);
}

/**
 * @param {Node} target
 * @param {string} style_sheet_id
 * @param {string} styles
 * @returns {void}
 */
function append_styles(target, style_sheet_id, styles) {
	const append_styles_to = get_root_for_style(target);
	if (!append_styles_to.getElementById(style_sheet_id)) {
		const style = element('style');
		style.id = style_sheet_id;
		style.textContent = styles;
		append_stylesheet(append_styles_to, style);
	}
}

/**
 * @param {Node} node
 * @returns {ShadowRoot | Document}
 */
function get_root_for_style(node) {
	if (!node) return document;
	const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
	if (root && /** @type {ShadowRoot} */ (root).host) {
		return /** @type {ShadowRoot} */ (root);
	}
	return node.ownerDocument;
}

/**
 * @param {ShadowRoot | Document} node
 * @param {HTMLStyleElement} style
 * @returns {CSSStyleSheet}
 */
function append_stylesheet(node, style) {
	append(/** @type {Document} */ (node).head || node, style);
	return style.sheet;
}

/**
 * @param {Node} target
 * @param {Node} node
 * @param {Node} [anchor]
 * @returns {void}
 */
function insert(target, node, anchor) {
	target.insertBefore(node, anchor || null);
}

/**
 * @param {Node} node
 * @returns {void}
 */
function detach(node) {
	if (node.parentNode) {
		node.parentNode.removeChild(node);
	}
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} name
 * @returns {HTMLElementTagNameMap[K]}
 */
function element(name) {
	return document.createElement(name);
}

/**
 * @param {string} data
 * @returns {Text}
 */
function text(data) {
	return document.createTextNode(data);
}

/**
 * @returns {Text} */
function space() {
	return text(' ');
}

/**
 * @returns {Text} */
function empty() {
	return text('');
}

/**
 * @param {EventTarget} node
 * @param {string} event
 * @param {EventListenerOrEventListenerObject} handler
 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
 * @returns {() => void}
 */
function listen(node, event, handler, options) {
	node.addEventListener(event, handler, options);
	return () => node.removeEventListener(event, handler, options);
}

/**
 * @param {Element} node
 * @param {string} attribute
 * @param {string} [value]
 * @returns {void}
 */
function attr(node, attribute, value) {
	if (value == null) node.removeAttribute(attribute);
	else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}

/**
 * @param {Element} element
 * @returns {ChildNode[]}
 */
function children(element) {
	return Array.from(element.childNodes);
}

/**
 * @returns {void} */
function set_style(node, key, value, important) {
	if (value == null) {
		node.style.removeProperty(key);
	} else {
		node.style.setProperty(key, value, important ? 'important' : '');
	}
}

/**
 * @returns {void} */
function toggle_class(element, name, toggle) {
	// The `!!` is required because an `undefined` flag means flipping the current state.
	element.classList.toggle(name, !!toggle);
}

/**
 * @template T
 * @param {string} type
 * @param {T} [detail]
 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
 * @returns {CustomEvent<T>}
 */
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
	return new CustomEvent(type, { detail, bubbles, cancelable });
}

/**
 * @typedef {Node & {
 * 	claim_order?: number;
 * 	hydrate_init?: true;
 * 	actual_end_child?: NodeEx;
 * 	childNodes: NodeListOf<NodeEx>;
 * }} NodeEx
 */

/** @typedef {ChildNode & NodeEx} ChildNodeEx */

/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

/**
 * @typedef {ChildNodeEx[] & {
 * 	claim_info?: {
 * 		last_index: number;
 * 		total_claimed: number;
 * 	};
 * }} ChildNodeArray
 */

let current_component;

/** @returns {void} */
function set_current_component(component) {
	current_component = component;
}

function get_current_component() {
	if (!current_component) throw new Error('Function called outside component initialization');
	return current_component;
}

/**
 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
 * it can be called from an external module).
 *
 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
 *
 * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
 *
 * https://svelte.dev/docs/svelte#onmount
 * @template T
 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
 * @returns {void}
 */
function onMount(fn) {
	get_current_component().$$.on_mount.push(fn);
}

/**
 * Creates an event dispatcher that can be used to dispatch [component events](https://svelte.dev/docs#template-syntax-component-directives-on-eventname).
 * Event dispatchers are functions that can take two arguments: `name` and `detail`.
 *
 * Component events created with `createEventDispatcher` create a
 * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
 * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
 * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
 * property and can contain any type of data.
 *
 * The event dispatcher can be typed to narrow the allowed event names and the type of the `detail` argument:
 * ```ts
 * const dispatch = createEventDispatcher<{
 *  loaded: never; // does not take a detail argument
 *  change: string; // takes a detail argument of type string, which is required
 *  optional: number | null; // takes an optional detail argument of type number
 * }>();
 * ```
 *
 * https://svelte.dev/docs/svelte#createeventdispatcher
 * @template {Record<string, any>} [EventMap=any]
 * @returns {import('./public.js').EventDispatcher<EventMap>}
 */
function createEventDispatcher() {
	const component = get_current_component();
	return (type, detail, { cancelable = false } = {}) => {
		const callbacks = component.$$.callbacks[type];
		if (callbacks) {
			// TODO are there situations where events could be dispatched
			// in a server (non-DOM) environment?
			const event = custom_event(/** @type {string} */ (type), detail, { cancelable });
			callbacks.slice().forEach((fn) => {
				fn.call(component, event);
			});
			return !event.defaultPrevented;
		}
		return true;
	};
}

const dirty_components = [];
const binding_callbacks = [];

let render_callbacks = [];

const flush_callbacks = [];

const resolved_promise = /* @__PURE__ */ Promise.resolve();

let update_scheduled = false;

/** @returns {void} */
function schedule_update() {
	if (!update_scheduled) {
		update_scheduled = true;
		resolved_promise.then(flush);
	}
}

/** @returns {void} */
function add_render_callback(fn) {
	render_callbacks.push(fn);
}

/** @returns {void} */
function add_flush_callback(fn) {
	flush_callbacks.push(fn);
}

// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();

let flushidx = 0; // Do *not* move this inside the flush() function

/** @returns {void} */
function flush() {
	// Do not reenter flush while dirty components are updated, as this can
	// result in an infinite loop. Instead, let the inner flush handle it.
	// Reentrancy is ok afterwards for bindings etc.
	if (flushidx !== 0) {
		return;
	}
	const saved_component = current_component;
	do {
		// first, call beforeUpdate functions
		// and update components
		try {
			while (flushidx < dirty_components.length) {
				const component = dirty_components[flushidx];
				flushidx++;
				set_current_component(component);
				update(component.$$);
			}
		} catch (e) {
			// reset dirty state to not end up in a deadlocked state and then rethrow
			dirty_components.length = 0;
			flushidx = 0;
			throw e;
		}
		set_current_component(null);
		dirty_components.length = 0;
		flushidx = 0;
		while (binding_callbacks.length) binding_callbacks.pop()();
		// then, once components are updated, call
		// afterUpdate functions. This may cause
		// subsequent updates...
		for (let i = 0; i < render_callbacks.length; i += 1) {
			const callback = render_callbacks[i];
			if (!seen_callbacks.has(callback)) {
				// ...so guard against infinite loops
				seen_callbacks.add(callback);
				callback();
			}
		}
		render_callbacks.length = 0;
	} while (dirty_components.length);
	while (flush_callbacks.length) {
		flush_callbacks.pop()();
	}
	update_scheduled = false;
	seen_callbacks.clear();
	set_current_component(saved_component);
}

/** @returns {void} */
function update($$) {
	if ($$.fragment !== null) {
		$$.update();
		run_all($$.before_update);
		const dirty = $$.dirty;
		$$.dirty = [-1];
		$$.fragment && $$.fragment.p($$.ctx, dirty);
		$$.after_update.forEach(add_render_callback);
	}
}

/**
 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
 * @param {Function[]} fns
 * @returns {void}
 */
function flush_render_callbacks(fns) {
	const filtered = [];
	const targets = [];
	render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
	targets.forEach((c) => c());
	render_callbacks = filtered;
}

const outroing = new Set();

/**
 * @type {Outro}
 */
let outros;

/**
 * @returns {void} */
function group_outros() {
	outros = {
		r: 0,
		c: [],
		p: outros // parent group
	};
}

/**
 * @returns {void} */
function check_outros() {
	if (!outros.r) {
		run_all(outros.c);
	}
	outros = outros.p;
}

/**
 * @param {import('./private.js').Fragment} block
 * @param {0 | 1} [local]
 * @returns {void}
 */
function transition_in(block, local) {
	if (block && block.i) {
		outroing.delete(block);
		block.i(local);
	}
}

/**
 * @param {import('./private.js').Fragment} block
 * @param {0 | 1} local
 * @param {0 | 1} [detach]
 * @param {() => void} [callback]
 * @returns {void}
 */
function transition_out(block, local, detach, callback) {
	if (block && block.o) {
		if (outroing.has(block)) return;
		outroing.add(block);
		outros.c.push(() => {
			outroing.delete(block);
			if (callback) {
				if (detach) block.d(1);
				callback();
			}
		});
		block.o(local);
	} else if (callback) {
		callback();
	}
}

/** @typedef {1} INTRO */
/** @typedef {0} OUTRO */
/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

/**
 * @typedef {Object} Outro
 * @property {number} r
 * @property {Function[]} c
 * @property {Object} p
 */

/**
 * @typedef {Object} PendingProgram
 * @property {number} start
 * @property {INTRO|OUTRO} b
 * @property {Outro} [group]
 */

/**
 * @typedef {Object} Program
 * @property {number} a
 * @property {INTRO|OUTRO} b
 * @property {1|-1} d
 * @property {number} duration
 * @property {number} start
 * @property {number} end
 * @property {Outro} [group]
 */

// general each functions:

function ensure_array_like(array_like_or_iterator) {
	return array_like_or_iterator?.length !== undefined
		? array_like_or_iterator
		: Array.from(array_like_or_iterator);
}

/** @returns {void} */
function outro_and_destroy_block(block, lookup) {
	transition_out(block, 1, 1, () => {
		lookup.delete(block.key);
	});
}

/** @returns {any[]} */
function update_keyed_each(
	old_blocks,
	dirty,
	get_key,
	dynamic,
	ctx,
	list,
	lookup,
	node,
	destroy,
	create_each_block,
	next,
	get_context
) {
	let o = old_blocks.length;
	let n = list.length;
	let i = o;
	const old_indexes = {};
	while (i--) old_indexes[old_blocks[i].key] = i;
	const new_blocks = [];
	const new_lookup = new Map();
	const deltas = new Map();
	const updates = [];
	i = n;
	while (i--) {
		const child_ctx = get_context(ctx, list, i);
		const key = get_key(child_ctx);
		let block = lookup.get(key);
		if (!block) {
			block = create_each_block(key, child_ctx);
			block.c();
		} else if (dynamic) {
			// defer updates until all the DOM shuffling is done
			updates.push(() => block.p(child_ctx, dirty));
		}
		new_lookup.set(key, (new_blocks[i] = block));
		if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
	}
	const will_move = new Set();
	const did_move = new Set();
	/** @returns {void} */
	function insert(block) {
		transition_in(block, 1);
		block.m(node, next);
		lookup.set(block.key, block);
		next = block.first;
		n--;
	}
	while (o && n) {
		const new_block = new_blocks[n - 1];
		const old_block = old_blocks[o - 1];
		const new_key = new_block.key;
		const old_key = old_block.key;
		if (new_block === old_block) {
			// do nothing
			next = new_block.first;
			o--;
			n--;
		} else if (!new_lookup.has(old_key)) {
			// remove old block
			destroy(old_block, lookup);
			o--;
		} else if (!lookup.has(new_key) || will_move.has(new_key)) {
			insert(new_block);
		} else if (did_move.has(old_key)) {
			o--;
		} else if (deltas.get(new_key) > deltas.get(old_key)) {
			did_move.add(new_key);
			insert(new_block);
		} else {
			will_move.add(old_key);
			o--;
		}
	}
	while (o--) {
		const old_block = old_blocks[o];
		if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
	}
	while (n) insert(new_blocks[n - 1]);
	run_all(updates);
	return new_blocks;
}

/** @returns {void} */
function bind(component, name, callback) {
	const index = component.$$.props[name];
	if (index !== undefined) {
		component.$$.bound[index] = callback;
		callback(component.$$.ctx[index]);
	}
}

/** @returns {void} */
function create_component(block) {
	block && block.c();
}

/** @returns {void} */
function mount_component(component, target, anchor) {
	const { fragment, after_update } = component.$$;
	fragment && fragment.m(target, anchor);
	// onMount happens before the initial afterUpdate
	add_render_callback(() => {
		const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
		// if the component was destroyed immediately
		// it will update the `$$.on_destroy` reference to `null`.
		// the destructured on_destroy may still reference to the old array
		if (component.$$.on_destroy) {
			component.$$.on_destroy.push(...new_on_destroy);
		} else {
			// Edge case - component was destroyed immediately,
			// most likely as a result of a binding initialising
			run_all(new_on_destroy);
		}
		component.$$.on_mount = [];
	});
	after_update.forEach(add_render_callback);
}

/** @returns {void} */
function destroy_component(component, detaching) {
	const $$ = component.$$;
	if ($$.fragment !== null) {
		flush_render_callbacks($$.after_update);
		run_all($$.on_destroy);
		$$.fragment && $$.fragment.d(detaching);
		// TODO null out other refs, including component.$$ (but need to
		// preserve final state?)
		$$.on_destroy = $$.fragment = null;
		$$.ctx = [];
	}
}

/** @returns {void} */
function make_dirty(component, i) {
	if (component.$$.dirty[0] === -1) {
		dirty_components.push(component);
		schedule_update();
		component.$$.dirty.fill(0);
	}
	component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
}

// TODO: Document the other params
/**
 * @param {SvelteComponent} component
 * @param {import('./public.js').ComponentConstructorOptions} options
 *
 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
 * This will be the `add_css` function from the compiled component.
 *
 * @returns {void}
 */
function init(
	component,
	options,
	instance,
	create_fragment,
	not_equal,
	props,
	append_styles = null,
	dirty = [-1]
) {
	const parent_component = current_component;
	set_current_component(component);
	/** @type {import('./private.js').T$$} */
	const $$ = (component.$$ = {
		fragment: null,
		ctx: [],
		// state
		props,
		update: noop,
		not_equal,
		bound: blank_object(),
		// lifecycle
		on_mount: [],
		on_destroy: [],
		on_disconnect: [],
		before_update: [],
		after_update: [],
		context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
		// everything else
		callbacks: blank_object(),
		dirty,
		skip_bound: false,
		root: options.target || parent_component.$$.root
	});
	append_styles && append_styles($$.root);
	let ready = false;
	$$.ctx = instance
		? instance(component, options.props || {}, (i, ret, ...rest) => {
				const value = rest.length ? rest[0] : ret;
				if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
					if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
					if (ready) make_dirty(component, i);
				}
				return ret;
		  })
		: [];
	$$.update();
	ready = true;
	run_all($$.before_update);
	// `false` as a special case of no DOM component
	$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
	if (options.target) {
		if (options.hydrate) {
			// TODO: what is the correct type here?
			// @ts-expect-error
			const nodes = children(options.target);
			$$.fragment && $$.fragment.l(nodes);
			nodes.forEach(detach);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			$$.fragment && $$.fragment.c();
		}
		if (options.intro) transition_in(component.$$.fragment);
		mount_component(component, options.target, options.anchor);
		flush();
	}
	set_current_component(parent_component);
}

/**
 * Base class for Svelte components. Used when dev=false.
 *
 * @template {Record<string, any>} [Props=any]
 * @template {Record<string, any>} [Events=any]
 */
class SvelteComponent {
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$ = undefined;
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$set = undefined;

	/** @returns {void} */
	$destroy() {
		destroy_component(this, 1);
		this.$destroy = noop;
	}

	/**
	 * @template {Extract<keyof Events, string>} K
	 * @param {K} type
	 * @param {((e: Events[K]) => void) | null | undefined} callback
	 * @returns {() => void}
	 */
	$on(type, callback) {
		if (!is_function(callback)) {
			return noop;
		}
		const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
		callbacks.push(callback);
		return () => {
			const index = callbacks.indexOf(callback);
			if (index !== -1) callbacks.splice(index, 1);
		};
	}

	/**
	 * @param {Partial<Props>} props
	 * @returns {void}
	 */
	$set(props) {
		if (this.$$set && !is_empty(props)) {
			this.$$.skip_bound = true;
			this.$$set(props);
			this.$$.skip_bound = false;
		}
	}
}

/**
 * @typedef {Object} CustomElementPropDefinition
 * @property {string} [attribute]
 * @property {boolean} [reflect]
 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
 */

// generated during release, do not modify

const PUBLIC_VERSION = '4';

if (typeof window !== 'undefined')
	// @ts-ignore
	(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

function throttle(func, timeFrame) {
  let lastTime = 0;
  return function (...args) {
    let now = new Date();
    if (now - lastTime >= timeFrame) {
      func(...args);
      lastTime = now;
    }
  };
}

function getRowsCount$1(items, cols) {
  const getItemsMaxHeight = items.map((val) => {
    const item = val[cols];

    return (item && item.y) + (item && item.h) || 0;
  });

  return Math.max(...getItemsMaxHeight, 1);
}

const getColumn = (containerWidth, columns) => {
  const sortColumns = columns.slice().sort((a, b) => a[0] - b[0]);

  const breakpoint = sortColumns.find((value) => {
    const [width] = value;
    return containerWidth <= width;
  });

  if (breakpoint) {
    return breakpoint[1];
  } else {
    return sortColumns[sortColumns.length - 1][1];
  }
};

function getContainerHeight(items, yPerPx, cols) {
  return getRowsCount$1(items, cols) * yPerPx;
}

const makeMatrix$1 = (rows, cols) => Array.from(Array(rows), () => new Array(cols)); // make 2d array

function makeMatrixFromItems$1(items, _row, _col) {
  let matrix = makeMatrix$1(_row, _col);

  for (var i = 0; i < items.length; i++) {
    const value = items[i][_col];
    if (value) {
      const { x, y, h } = value;
      const id = items[i].id;
      const w = Math.min(_col, value.w);

      for (var j = y; j < y + h; j++) {
        const row = matrix[j];
        for (var k = x; k < x + w; k++) {
          row[k] = { ...value, id };
        }
      }
    }
  }
  return matrix;
}

function findCloseBlocks$1(items, matrix, curObject) {
  const { h, x, y } = curObject;

  const w = Math.min(matrix[0].length, curObject.w);
  const tempR = matrix.slice(y, y + h);

  let result = [];
  for (var i = 0; i < tempR.length; i++) {
    let tempA = tempR[i].slice(x, x + w);
    result = [...result, ...tempA.map((val) => val.id && val.id !== curObject.id && val.id).filter(Boolean)];
  }

  return [...new Set(result)];
}

function makeMatrixFromItemsIgnore$1(items, ignoreList, _row, _col) {
  let matrix = makeMatrix$1(_row, _col);
  for (var i = 0; i < items.length; i++) {
    const value = items[i][_col];
    const id = items[i].id;
    const { x, y, h } = value;
    const w = Math.min(_col, value.w);

    if (ignoreList.indexOf(id) === -1) {
      for (var j = y; j < y + h; j++) {
        const row = matrix[j];
        if (row) {
          for (var k = x; k < x + w; k++) {
            row[k] = { ...value, id };
          }
        }
      }
    }
  }
  return matrix;
}

function findItemsById$1(closeBlocks, items) {
  return items.filter((value) => closeBlocks.indexOf(value.id) !== -1);
}

function getItemById(id, items) {
  return items.find((value) => value.id === id);
}

function findFreeSpaceForItem$1(matrix, item) {
  const cols = matrix[0].length;
  const w = Math.min(cols, item.w);
  let xNtime = cols - w;
  let getMatrixRows = matrix.length;

  for (var i = 0; i < getMatrixRows; i++) {
    const row = matrix[i];
    for (var j = 0; j < xNtime + 1; j++) {
      const sliceA = row.slice(j, j + w);
      const empty = sliceA.every((val) => val === undefined);
      if (empty) {
        const isEmpty = matrix.slice(i, i + item.h).every((a) => a.slice(j, j + w).every((n) => n === undefined));

        if (isEmpty) {
          return { y: i, x: j };
        }
      }
    }
  }

  return {
    y: getMatrixRows,
    x: 0,
  };
}

const getItem$1 = (item, col) => {
  return { ...item[col], id: item.id };
};

const updateItem$1 = (elements, active, position, col) => {
  return elements.map((value) => {
    if (value.id === active.id) {
      return { ...value, [col]: { ...value[col], ...position } };
    }
    return value;
  });
};

function moveItemsAroundItem(active, items, cols, original) {
  // Get current item from the breakpoint
  const activeItem = getItem$1(active, cols);
  const ids = items.map((value) => value.id).filter((value) => value !== activeItem.id);

  const els = items.filter((value) => value.id !== activeItem.id);

  // Update items
  let newItems = updateItem$1(items, active, activeItem, cols);

  let matrix = makeMatrixFromItemsIgnore$1(newItems, ids, getRowsCount$1(newItems, cols), cols);
  let tempItems = newItems;

  // Exclude resolved elements ids in array
  let exclude = [];

  els.forEach((item) => {
    // Find position for element
    let position = findFreeSpaceForItem$1(matrix, item[cols]);
    // Exclude item
    exclude.push(item.id);

    tempItems = updateItem$1(tempItems, item, position, cols);

    // Recreate ids of elements
    let getIgnoreItems = ids.filter((value) => exclude.indexOf(value) === -1);

    // Update matrix for next iteration
    matrix = makeMatrixFromItemsIgnore$1(tempItems, getIgnoreItems, getRowsCount$1(tempItems, cols), cols);
  });

  // Return result
  return tempItems;
}

function moveItem$1(active, items, cols, original) {
  // Get current item from the breakpoint
  const item = getItem$1(active, cols);

  // Create matrix from the items expect the active
  let matrix = makeMatrixFromItemsIgnore$1(items, [item.id], getRowsCount$1(items, cols), cols);
  // Getting the ids of items under active Array<String>
  const closeBlocks = findCloseBlocks$1(items, matrix, item);
  // Getting the objects of items under active Array<Object>
  let closeObj = findItemsById$1(closeBlocks, items);
  // Getting whenever of these items is fixed
  const fixed = closeObj.find((value) => value[cols].fixed);

  // If found fixed, reset the active to its original position
  if (fixed) return items;

  // Update items
  items = updateItem$1(items, active, item, cols);

  // Create matrix of items expect close elements
  matrix = makeMatrixFromItemsIgnore$1(items, closeBlocks, getRowsCount$1(items, cols), cols);

  // Create temp vars
  let tempItems = items;
  let tempCloseBlocks = closeBlocks;

  // Exclude resolved elements ids in array
  let exclude = [];

  // Iterate over close elements under active item
  closeObj.forEach((item) => {
    // Find position for element
    let position = findFreeSpaceForItem$1(matrix, item[cols]);
    // Exclude item
    exclude.push(item.id);

    // Assign the position to the element in the column
    tempItems = updateItem$1(tempItems, item, position, cols);

    // Recreate ids of elements
    let getIgnoreItems = tempCloseBlocks.filter((value) => exclude.indexOf(value) === -1);

    // Update matrix for next iteration
    matrix = makeMatrixFromItemsIgnore$1(tempItems, getIgnoreItems, getRowsCount$1(tempItems, cols), cols);
  });

  // Return result
  return tempItems;
}

function getUndefinedItems(items, col, breakpoints) {
  return items
    .map((value) => {
      if (!value[col]) {
        return value.id;
      }
    })
    .filter(Boolean);
}

function getClosestColumn(items, item, col, breakpoints) {
  return breakpoints
    .map(([_, column]) => item[column] && column)
    .filter(Boolean)
    .reduce(function (acc, value) {
      const isLower = Math.abs(value - col) < Math.abs(acc - col);

      return isLower ? value : acc;
    });
}

function specifyUndefinedColumns(items, col, breakpoints) {
  let matrix = makeMatrixFromItems$1(items, getRowsCount$1(items, col), col);

  const getUndefinedElements = getUndefinedItems(items, col);

  let newItems = [...items];

  getUndefinedElements.forEach((elementId) => {
    const getElement = items.find((item) => item.id === elementId);

    const closestColumn = getClosestColumn(items, getElement, col, breakpoints);

    const position = findFreeSpaceForItem$1(matrix, getElement[closestColumn]);

    const newItem = {
      ...getElement,
      [col]: {
        ...getElement[closestColumn],
        ...position,
      },
    };

    newItems = newItems.map((value) => (value.id === elementId ? newItem : value));

    matrix = makeMatrixFromItems$1(newItems, getRowsCount$1(newItems, col), col);
  });
  return newItems;
}

/* node_modules/svelte-grid/src/MoveResize/index.svelte generated by Svelte v4.2.19 */

function add_css$1(target) {
	append_styles(target, "svelte-x23om8", ".svlt-grid-item.svelte-x23om8{touch-action:none;position:absolute;will-change:auto;backface-visibility:hidden;-webkit-backface-visibility:hidden}.svlt-grid-resizer.svelte-x23om8{user-select:none;width:20px;height:20px;position:absolute;right:0;bottom:0;cursor:se-resize}.svlt-grid-resizer.svelte-x23om8::after{content:\"\";position:absolute;right:3px;bottom:3px;width:5px;height:5px;border-right:2px solid rgba(0, 0, 0, 0.4);border-bottom:2px solid rgba(0, 0, 0, 0.4)}.svlt-grid-active.svelte-x23om8{z-index:3;cursor:grabbing;position:fixed;opacity:0.5;backface-visibility:hidden;-webkit-backface-visibility:hidden;-moz-backface-visibility:hidden;-o-backface-visibility:hidden;-ms-backface-visibility:hidden;user-select:none}.shadow-active.svelte-x23om8{z-index:2;transition:all 0.2s}.svlt-grid-shadow.svelte-x23om8{position:absolute;background:red;will-change:transform;background:pink;backface-visibility:hidden;-webkit-backface-visibility:hidden}");
}

const get_default_slot_changes$1 = dirty => ({});

const get_default_slot_context$1 = ctx => ({
	movePointerDown: /*pointerdown*/ ctx[18],
	resizePointerDown: /*resizePointerDown*/ ctx[19]
});

// (68:2) {#if resizable && !item.customResizer}
function create_if_block_1$1(ctx) {
	let div;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			attr(div, "class", "svlt-grid-resizer svelte-x23om8");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (!mounted) {
				dispose = listen(div, "pointerdown", /*resizePointerDown*/ ctx[19]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			mounted = false;
			dispose();
		}
	};
}

// (73:0) {#if active || trans}
function create_if_block$1(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			attr(div, "class", "svlt-grid-shadow shadow-active svelte-x23om8");
			set_style(div, "width", /*shadow*/ ctx[12].w * /*xPerPx*/ ctx[6] - /*gapX*/ ctx[8] * 2 + "px");
			set_style(div, "height", /*shadow*/ ctx[12].h * /*yPerPx*/ ctx[7] - /*gapY*/ ctx[9] * 2 + "px");
			set_style(div, "transform", "translate(" + (/*shadow*/ ctx[12].x * /*xPerPx*/ ctx[6] + /*gapX*/ ctx[8]) + "px, " + (/*shadow*/ ctx[12].y * /*yPerPx*/ ctx[7] + /*gapY*/ ctx[9]) + "px)");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			/*div_binding*/ ctx[29](div);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*shadow, xPerPx, gapX*/ 4416) {
				set_style(div, "width", /*shadow*/ ctx[12].w * /*xPerPx*/ ctx[6] - /*gapX*/ ctx[8] * 2 + "px");
			}

			if (dirty[0] & /*shadow, yPerPx, gapY*/ 4736) {
				set_style(div, "height", /*shadow*/ ctx[12].h * /*yPerPx*/ ctx[7] - /*gapY*/ ctx[9] * 2 + "px");
			}

			if (dirty[0] & /*shadow, xPerPx, gapX, yPerPx, gapY*/ 5056) {
				set_style(div, "transform", "translate(" + (/*shadow*/ ctx[12].x * /*xPerPx*/ ctx[6] + /*gapX*/ ctx[8]) + "px, " + (/*shadow*/ ctx[12].y * /*yPerPx*/ ctx[7] + /*gapY*/ ctx[9]) + "px)");
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			/*div_binding*/ ctx[29](null);
		}
	};
}

function create_fragment$2(ctx) {
	let div;
	let t0;
	let div_style_value;
	let t1;
	let if_block1_anchor;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[28].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[27], get_default_slot_context$1);
	let if_block0 = /*resizable*/ ctx[4] && !/*item*/ ctx[10].customResizer && create_if_block_1$1(ctx);
	let if_block1 = (/*active*/ ctx[13] || /*trans*/ ctx[16]) && create_if_block$1(ctx);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			if (if_block1) if_block1.c();
			if_block1_anchor = empty();
			attr(div, "draggable", false);
			attr(div, "class", "svlt-grid-item svelte-x23om8");

			attr(div, "style", div_style_value = "width: " + (/*active*/ ctx[13]
			? /*newSize*/ ctx[15].width
			: /*width*/ ctx[0]) + "px; height:" + (/*active*/ ctx[13]
			? /*newSize*/ ctx[15].height
			: /*height*/ ctx[1]) + "px; " + (/*active*/ ctx[13]
			? `transform: translate(${/*cordDiff*/ ctx[14].x}px, ${/*cordDiff*/ ctx[14].y}px);top:${/*rect*/ ctx[17].top}px;left:${/*rect*/ ctx[17].left}px;`
			: /*trans*/ ctx[16]
				? `transform: translate(${/*cordDiff*/ ctx[14].x}px, ${/*cordDiff*/ ctx[14].y}px); position:absolute; transition: width 0.2s, height 0.2s;`
				: `transition: transform 0.2s, opacity 0.2s; transform: translate(${/*left*/ ctx[2]}px, ${/*top*/ ctx[3]}px); `) + "");

			toggle_class(div, "svlt-grid-active", /*active*/ ctx[13] || /*trans*/ ctx[16] && /*rect*/ ctx[17]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append(div, t0);
			if (if_block0) if_block0.m(div, null);
			insert(target, t1, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, if_block1_anchor, anchor);
			current = true;

			if (!mounted) {
				dispose = listen(div, "pointerdown", function () {
					if (is_function(/*item*/ ctx[10] && /*item*/ ctx[10].customDragger
					? null
					: /*draggable*/ ctx[5] && /*pointerdown*/ ctx[18])) (/*item*/ ctx[10] && /*item*/ ctx[10].customDragger
					? null
					: /*draggable*/ ctx[5] && /*pointerdown*/ ctx[18]).apply(this, arguments);
				});

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (default_slot) {
				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 134217728)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[27],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[27])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[27], dirty, get_default_slot_changes$1),
						get_default_slot_context$1
					);
				}
			}

			if (/*resizable*/ ctx[4] && !/*item*/ ctx[10].customResizer) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_1$1(ctx);
					if_block0.c();
					if_block0.m(div, null);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (!current || dirty[0] & /*active, newSize, width, height, cordDiff, rect, trans, left, top*/ 253967 && div_style_value !== (div_style_value = "width: " + (/*active*/ ctx[13]
			? /*newSize*/ ctx[15].width
			: /*width*/ ctx[0]) + "px; height:" + (/*active*/ ctx[13]
			? /*newSize*/ ctx[15].height
			: /*height*/ ctx[1]) + "px; " + (/*active*/ ctx[13]
			? `transform: translate(${/*cordDiff*/ ctx[14].x}px, ${/*cordDiff*/ ctx[14].y}px);top:${/*rect*/ ctx[17].top}px;left:${/*rect*/ ctx[17].left}px;`
			: /*trans*/ ctx[16]
				? `transform: translate(${/*cordDiff*/ ctx[14].x}px, ${/*cordDiff*/ ctx[14].y}px); position:absolute; transition: width 0.2s, height 0.2s;`
				: `transition: transform 0.2s, opacity 0.2s; transform: translate(${/*left*/ ctx[2]}px, ${/*top*/ ctx[3]}px); `) + "")) {
				attr(div, "style", div_style_value);
			}

			if (!current || dirty[0] & /*active, trans, rect*/ 204800) {
				toggle_class(div, "svlt-grid-active", /*active*/ ctx[13] || /*trans*/ ctx[16] && /*rect*/ ctx[17]);
			}

			if (/*active*/ ctx[13] || /*trans*/ ctx[16]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block$1(ctx);
					if_block1.c();
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
				detach(t1);
				detach(if_block1_anchor);
			}

			if (default_slot) default_slot.d(detaching);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d(detaching);
			mounted = false;
			dispose();
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	const dispatch = createEventDispatcher();
	let { sensor } = $$props;
	let { width } = $$props;
	let { height } = $$props;
	let { left } = $$props;
	let { top } = $$props;
	let { resizable } = $$props;
	let { draggable } = $$props;
	let { id } = $$props;
	let { container } = $$props;
	let { xPerPx } = $$props;
	let { yPerPx } = $$props;
	let { gapX } = $$props;
	let { gapY } = $$props;
	let { item } = $$props;
	let { max } = $$props;
	let { min } = $$props;
	let { cols } = $$props;
	let { nativeContainer } = $$props;
	let shadowElement;
	let shadow = {};
	let active = false;
	let initX, initY;
	let capturePos = { x: 0, y: 0 };
	let cordDiff = { x: 0, y: 0 };
	let newSize = { width, height };
	let trans = false;
	let anima;

	const inActivate = () => {
		const shadowBound = shadowElement.getBoundingClientRect();
		const xdragBound = rect.left + cordDiff.x;
		const ydragBound = rect.top + cordDiff.y;
		$$invalidate(14, cordDiff.x = shadow.x * xPerPx + gapX - (shadowBound.x - xdragBound), cordDiff);
		$$invalidate(14, cordDiff.y = shadow.y * yPerPx + gapY - (shadowBound.y - ydragBound), cordDiff);
		$$invalidate(13, active = false);
		$$invalidate(16, trans = true);
		clearTimeout(anima);

		anima = setTimeout(
			() => {
				$$invalidate(16, trans = false);
			},
			100
		);

		dispatch("pointerup", { id });
	};

	let repaint = (cb, isPointerUp) => {
		dispatch("repaint", { id, shadow, isPointerUp, onUpdate: cb });
	};

	// Autoscroll
	let _scrollTop = 0;

	let containerFrame;
	let rect;
	let scrollElement;

	const getContainerFrame = element => {
		if (element === document.documentElement || !element) {
			const { height, top, right, bottom, left } = nativeContainer.getBoundingClientRect();

			return {
				top: Math.max(0, top),
				bottom: Math.min(window.innerHeight, bottom)
			};
		}

		return element.getBoundingClientRect();
	};

	const getScroller = element => !element ? document.documentElement : element;

	const pointerdown = ({ clientX, clientY, target }) => {
		initX = clientX;
		initY = clientY;
		capturePos = { x: left, y: top };

		$$invalidate(12, shadow = {
			x: item.x,
			y: item.y,
			w: item.w,
			h: item.h
		});

		$$invalidate(15, newSize = { width, height });
		containerFrame = getContainerFrame(container);
		scrollElement = getScroller(container);
		$$invalidate(14, cordDiff = { x: 0, y: 0 });
		$$invalidate(17, rect = target.closest(".svlt-grid-item").getBoundingClientRect());
		$$invalidate(13, active = true);
		$$invalidate(16, trans = false);
		_scrollTop = scrollElement.scrollTop;
		window.addEventListener("pointermove", pointermove);
		window.addEventListener("pointerup", pointerup);
	};

	let sign = { x: 0, y: 0 };
	let vel = { x: 0, y: 0 };
	let intervalId = 0;

	const stopAutoscroll = () => {
		clearInterval(intervalId);
		intervalId = false;
		sign = { x: 0, y: 0 };
		vel = { x: 0, y: 0 };
	};

	const update = () => {
		const _newScrollTop = scrollElement.scrollTop - _scrollTop;
		const boundX = capturePos.x + cordDiff.x;
		const boundY = capturePos.y + (cordDiff.y + _newScrollTop);
		let gridX = Math.round(boundX / xPerPx);
		let gridY = Math.round(boundY / yPerPx);
		$$invalidate(12, shadow.x = Math.max(Math.min(gridX, cols - shadow.w), 0), shadow);
		$$invalidate(12, shadow.y = Math.max(gridY, 0), shadow);

		if (max.y) {
			$$invalidate(12, shadow.y = Math.min(shadow.y, max.y), shadow);
		}

		repaint();
	};

	const pointermove = event => {
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
		const { clientX, clientY } = event;
		$$invalidate(14, cordDiff = { x: clientX - initX, y: clientY - initY });
		const Y_SENSOR = sensor;
		let velocityTop = Math.max(0, (containerFrame.top + Y_SENSOR - clientY) / Y_SENSOR);
		let velocityBottom = Math.max(0, (clientY - (containerFrame.bottom - Y_SENSOR)) / Y_SENSOR);
		const topSensor = velocityTop > 0 && velocityBottom === 0;
		const bottomSensor = velocityBottom > 0 && velocityTop === 0;
		sign.y = topSensor ? -1 : bottomSensor ? 1 : 0;
		vel.y = sign.y === -1 ? velocityTop : velocityBottom;

		if (vel.y > 0) {
			if (!intervalId) {
				// Start scrolling
				// TODO Use requestAnimationFrame
				intervalId = setInterval(
					() => {
						scrollElement.scrollTop += 2 * (vel.y + Math.sign(vel.y)) * sign.y;
						update();
					},
					10
				);
			}
		} else if (intervalId) {
			stopAutoscroll();
		} else {
			update();
		}
	};

	const pointerup = e => {
		stopAutoscroll();
		window.removeEventListener("pointerdown", pointerdown);
		window.removeEventListener("pointermove", pointermove);
		window.removeEventListener("pointerup", pointerup);
		repaint(inActivate, true);
	};

	// Resize
	let resizeInitPos = { x: 0, y: 0 };

	let initSize = { width: 0, height: 0 };

	const resizePointerDown = e => {
		e.stopPropagation();
		const { pageX, pageY } = e;
		resizeInitPos = { x: pageX, y: pageY };
		initSize = { width, height };
		$$invalidate(14, cordDiff = { x: 0, y: 0 });
		$$invalidate(17, rect = e.target.closest(".svlt-grid-item").getBoundingClientRect());
		$$invalidate(15, newSize = { width, height });
		$$invalidate(13, active = true);
		$$invalidate(16, trans = false);

		$$invalidate(12, shadow = {
			x: item.x,
			y: item.y,
			w: item.w,
			h: item.h
		});

		containerFrame = getContainerFrame(container);
		scrollElement = getScroller(container);
		window.addEventListener("pointermove", resizePointerMove);
		window.addEventListener("pointerup", resizePointerUp);
	};

	const resizePointerMove = ({ pageX, pageY }) => {
		$$invalidate(15, newSize.width = initSize.width + pageX - resizeInitPos.x, newSize);
		$$invalidate(15, newSize.height = initSize.height + pageY - resizeInitPos.y, newSize);

		// Get max col number
		let maxWidth = cols - shadow.x;

		maxWidth = Math.min(max.w, maxWidth) || maxWidth;

		// Limit bound
		$$invalidate(15, newSize.width = Math.max(Math.min(newSize.width, maxWidth * xPerPx - gapX * 2), min.w * xPerPx - gapX * 2), newSize);

		$$invalidate(15, newSize.height = Math.max(newSize.height, min.h * yPerPx - gapY * 2), newSize);

		if (max.h) {
			$$invalidate(15, newSize.height = Math.min(newSize.height, max.h * yPerPx - gapY * 2), newSize);
		}

		// Limit col & row
		$$invalidate(12, shadow.w = Math.round((newSize.width + gapX * 2) / xPerPx), shadow);

		$$invalidate(12, shadow.h = Math.round((newSize.height + gapY * 2) / yPerPx), shadow);
		repaint();
	};

	const resizePointerUp = e => {
		e.stopPropagation();
		repaint(inActivate, true);
		window.removeEventListener("pointermove", resizePointerMove);
		window.removeEventListener("pointerup", resizePointerUp);
	};

	function div_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			shadowElement = $$value;
			$$invalidate(11, shadowElement);
		});
	}

	$$self.$$set = $$props => {
		if ('sensor' in $$props) $$invalidate(20, sensor = $$props.sensor);
		if ('width' in $$props) $$invalidate(0, width = $$props.width);
		if ('height' in $$props) $$invalidate(1, height = $$props.height);
		if ('left' in $$props) $$invalidate(2, left = $$props.left);
		if ('top' in $$props) $$invalidate(3, top = $$props.top);
		if ('resizable' in $$props) $$invalidate(4, resizable = $$props.resizable);
		if ('draggable' in $$props) $$invalidate(5, draggable = $$props.draggable);
		if ('id' in $$props) $$invalidate(21, id = $$props.id);
		if ('container' in $$props) $$invalidate(22, container = $$props.container);
		if ('xPerPx' in $$props) $$invalidate(6, xPerPx = $$props.xPerPx);
		if ('yPerPx' in $$props) $$invalidate(7, yPerPx = $$props.yPerPx);
		if ('gapX' in $$props) $$invalidate(8, gapX = $$props.gapX);
		if ('gapY' in $$props) $$invalidate(9, gapY = $$props.gapY);
		if ('item' in $$props) $$invalidate(10, item = $$props.item);
		if ('max' in $$props) $$invalidate(23, max = $$props.max);
		if ('min' in $$props) $$invalidate(24, min = $$props.min);
		if ('cols' in $$props) $$invalidate(25, cols = $$props.cols);
		if ('nativeContainer' in $$props) $$invalidate(26, nativeContainer = $$props.nativeContainer);
		if ('$$scope' in $$props) $$invalidate(27, $$scope = $$props.$$scope);
	};

	return [
		width,
		height,
		left,
		top,
		resizable,
		draggable,
		xPerPx,
		yPerPx,
		gapX,
		gapY,
		item,
		shadowElement,
		shadow,
		active,
		cordDiff,
		newSize,
		trans,
		rect,
		pointerdown,
		resizePointerDown,
		sensor,
		id,
		container,
		max,
		min,
		cols,
		nativeContainer,
		$$scope,
		slots,
		div_binding
	];
}

class MoveResize extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$2,
			create_fragment$2,
			safe_not_equal,
			{
				sensor: 20,
				width: 0,
				height: 1,
				left: 2,
				top: 3,
				resizable: 4,
				draggable: 5,
				id: 21,
				container: 22,
				xPerPx: 6,
				yPerPx: 7,
				gapX: 8,
				gapY: 9,
				item: 10,
				max: 23,
				min: 24,
				cols: 25,
				nativeContainer: 26
			},
			add_css$1,
			[-1, -1]
		);
	}
}

/* node_modules/svelte-grid/src/index.svelte generated by Svelte v4.2.19 */

function add_css(target) {
	append_styles(target, "svelte-1k5vgfu", ".svlt-grid-container.svelte-1k5vgfu{position:relative;width:100%}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[28] = list[i];
	child_ctx[30] = i;
	return child_ctx;
}

const get_default_slot_changes = dirty => ({
	movePointerDown: dirty[1] & /*movePointerDown*/ 2,
	resizePointerDown: dirty[1] & /*resizePointerDown*/ 1,
	dataItem: dirty[0] & /*items*/ 1,
	item: dirty[0] & /*items, getComputedCols*/ 17,
	index: dirty[0] & /*items*/ 1
});

const get_default_slot_context = ctx => ({
	movePointerDown: /*movePointerDown*/ ctx[32],
	resizePointerDown: /*resizePointerDown*/ ctx[31],
	dataItem: /*item*/ ctx[28],
	item: /*item*/ ctx[28][/*getComputedCols*/ ctx[4]],
	index: /*i*/ ctx[30]
});

// (9:2) {#if xPerPx || !fastStart}
function create_if_block(ctx) {
	let each_blocks = [];
	let each_1_lookup = new Map();
	let each_1_anchor;
	let current;
	let each_value = ensure_array_like(/*items*/ ctx[0]);
	const get_key = ctx => /*item*/ ctx[28].id;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(target, anchor);
				}
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*items, getComputedCols, xPerPx, yPerPx, gapX, gapY, sensor, scroller, container, handleRepaint, pointerup, $$scope*/ 2105213 | dirty[1] & /*movePointerDown, resizePointerDown*/ 3) {
				each_value = ensure_array_like(/*items*/ ctx[0]);
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(each_1_anchor);
			}

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d(detaching);
			}
		}
	};
}

// (34:8) {#if item[getComputedCols]}
function create_if_block_1(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[19].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[21], get_default_slot_context);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty[0] & /*$$scope, items, getComputedCols*/ 2097169 | dirty[1] & /*movePointerDown, resizePointerDown*/ 3)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[21],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[21])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[21], dirty, get_default_slot_changes),
						get_default_slot_context
					);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

// (11:6) <MoveResize         on:repaint={handleRepaint}         on:pointerup={pointerup}         id={item.id}         resizable={item[getComputedCols] && item[getComputedCols].resizable}         draggable={item[getComputedCols] && item[getComputedCols].draggable}         {xPerPx}         {yPerPx}         width={Math.min(getComputedCols, item[getComputedCols] && item[getComputedCols].w) * xPerPx - gapX * 2}         height={(item[getComputedCols] && item[getComputedCols].h) * yPerPx - gapY * 2}         top={(item[getComputedCols] && item[getComputedCols].y) * yPerPx + gapY}         left={(item[getComputedCols] && item[getComputedCols].x) * xPerPx + gapX}         item={item[getComputedCols]}         min={item[getComputedCols] && item[getComputedCols].min}         max={item[getComputedCols] && item[getComputedCols].max}         cols={getComputedCols}         {gapX}         {gapY}         {sensor}         container={scroller}         nativeContainer={container}         let:resizePointerDown         let:movePointerDown>
function create_default_slot$1(ctx) {
	let t;
	let current;
	let if_block = /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && create_if_block_1(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			t = space();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, t, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty[0] & /*items, getComputedCols*/ 17) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(t.parentNode, t);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(t);
			}

			if (if_block) if_block.d(detaching);
		}
	};
}

// (10:4) {#each items as item, i (item.id)}
function create_each_block(key_1, ctx) {
	let first;
	let moveresize;
	let current;

	moveresize = new MoveResize({
			props: {
				id: /*item*/ ctx[28].id,
				resizable: /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].resizable,
				draggable: /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].draggable,
				xPerPx: /*xPerPx*/ ctx[6],
				yPerPx: /*yPerPx*/ ctx[10],
				width: Math.min(/*getComputedCols*/ ctx[4], /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].w) * /*xPerPx*/ ctx[6] - /*gapX*/ ctx[9] * 2,
				height: (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].h) * /*yPerPx*/ ctx[10] - /*gapY*/ ctx[8] * 2,
				top: (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].y) * /*yPerPx*/ ctx[10] + /*gapY*/ ctx[8],
				left: (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].x) * /*xPerPx*/ ctx[6] + /*gapX*/ ctx[9],
				item: /*item*/ ctx[28][/*getComputedCols*/ ctx[4]],
				min: /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].min,
				max: /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].max,
				cols: /*getComputedCols*/ ctx[4],
				gapX: /*gapX*/ ctx[9],
				gapY: /*gapY*/ ctx[8],
				sensor: /*sensor*/ ctx[3],
				container: /*scroller*/ ctx[2],
				nativeContainer: /*container*/ ctx[5],
				$$slots: {
					default: [
						create_default_slot$1,
						({ resizePointerDown, movePointerDown }) => ({
							31: resizePointerDown,
							32: movePointerDown
						}),
						({ resizePointerDown, movePointerDown }) => [0, (resizePointerDown ? 1 : 0) | (movePointerDown ? 2 : 0)]
					]
				},
				$$scope: { ctx }
			}
		});

	moveresize.$on("repaint", /*handleRepaint*/ ctx[12]);
	moveresize.$on("pointerup", /*pointerup*/ ctx[11]);

	return {
		key: key_1,
		first: null,
		c() {
			first = empty();
			create_component(moveresize.$$.fragment);
			this.first = first;
		},
		m(target, anchor) {
			insert(target, first, anchor);
			mount_component(moveresize, target, anchor);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const moveresize_changes = {};
			if (dirty[0] & /*items*/ 1) moveresize_changes.id = /*item*/ ctx[28].id;
			if (dirty[0] & /*items, getComputedCols*/ 17) moveresize_changes.resizable = /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].resizable;
			if (dirty[0] & /*items, getComputedCols*/ 17) moveresize_changes.draggable = /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].draggable;
			if (dirty[0] & /*xPerPx*/ 64) moveresize_changes.xPerPx = /*xPerPx*/ ctx[6];
			if (dirty[0] & /*getComputedCols, items, xPerPx, gapX*/ 593) moveresize_changes.width = Math.min(/*getComputedCols*/ ctx[4], /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].w) * /*xPerPx*/ ctx[6] - /*gapX*/ ctx[9] * 2;
			if (dirty[0] & /*items, getComputedCols, gapY*/ 273) moveresize_changes.height = (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].h) * /*yPerPx*/ ctx[10] - /*gapY*/ ctx[8] * 2;
			if (dirty[0] & /*items, getComputedCols, gapY*/ 273) moveresize_changes.top = (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].y) * /*yPerPx*/ ctx[10] + /*gapY*/ ctx[8];
			if (dirty[0] & /*items, getComputedCols, xPerPx, gapX*/ 593) moveresize_changes.left = (/*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].x) * /*xPerPx*/ ctx[6] + /*gapX*/ ctx[9];
			if (dirty[0] & /*items, getComputedCols*/ 17) moveresize_changes.item = /*item*/ ctx[28][/*getComputedCols*/ ctx[4]];
			if (dirty[0] & /*items, getComputedCols*/ 17) moveresize_changes.min = /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].min;
			if (dirty[0] & /*items, getComputedCols*/ 17) moveresize_changes.max = /*item*/ ctx[28][/*getComputedCols*/ ctx[4]] && /*item*/ ctx[28][/*getComputedCols*/ ctx[4]].max;
			if (dirty[0] & /*getComputedCols*/ 16) moveresize_changes.cols = /*getComputedCols*/ ctx[4];
			if (dirty[0] & /*gapX*/ 512) moveresize_changes.gapX = /*gapX*/ ctx[9];
			if (dirty[0] & /*gapY*/ 256) moveresize_changes.gapY = /*gapY*/ ctx[8];
			if (dirty[0] & /*sensor*/ 8) moveresize_changes.sensor = /*sensor*/ ctx[3];
			if (dirty[0] & /*scroller*/ 4) moveresize_changes.container = /*scroller*/ ctx[2];
			if (dirty[0] & /*container*/ 32) moveresize_changes.nativeContainer = /*container*/ ctx[5];

			if (dirty[0] & /*$$scope, items, getComputedCols*/ 2097169 | dirty[1] & /*movePointerDown, resizePointerDown*/ 3) {
				moveresize_changes.$$scope = { dirty, ctx };
			}

			moveresize.$set(moveresize_changes);
		},
		i(local) {
			if (current) return;
			transition_in(moveresize.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(moveresize.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(first);
			}

			destroy_component(moveresize, detaching);
		}
	};
}

function create_fragment$1(ctx) {
	let div;
	let current;
	let if_block = (/*xPerPx*/ ctx[6] || !/*fastStart*/ ctx[1]) && create_if_block(ctx);

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "class", "svlt-grid-container svelte-1k5vgfu");
			set_style(div, "height", /*containerHeight*/ ctx[7] + "px");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			/*div_binding*/ ctx[20](div);
			current = true;
		},
		p(ctx, dirty) {
			if (/*xPerPx*/ ctx[6] || !/*fastStart*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty[0] & /*xPerPx, fastStart*/ 66) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (!current || dirty[0] & /*containerHeight*/ 128) {
				set_style(div, "height", /*containerHeight*/ ctx[7] + "px");
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block) if_block.d();
			/*div_binding*/ ctx[20](null);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let gapX;
	let gapY;
	let containerHeight;
	let { $$slots: slots = {}, $$scope } = $$props;
	const dispatch = createEventDispatcher();
	let { fillSpace = false } = $$props;
	let { items } = $$props;
	let { rowHeight } = $$props;
	let { cols } = $$props;
	let { gap = [10, 10] } = $$props;
	let { fastStart = false } = $$props;
	let { throttleUpdate = 100 } = $$props;
	let { throttleResize = 100 } = $$props;
	let { scroller = undefined } = $$props;
	let { sensor = 20 } = $$props;
	let getComputedCols;
	let container;
	let xPerPx = 0;
	let yPerPx = rowHeight;
	let containerWidth;

	const pointerup = ev => {
		dispatch("pointerup", { id: ev.detail.id, cols: getComputedCols });
	};

	const onResize = throttle(
		() => {
			$$invalidate(0, items = specifyUndefinedColumns(items, getComputedCols, cols));

			dispatch("resize", {
				cols: getComputedCols,
				xPerPx,
				yPerPx,
				width: containerWidth
			});
		},
		throttleUpdate
	);

	onMount(() => {
		const sizeObserver = new ResizeObserver(entries => {
				requestAnimationFrame(() => {
					let width = entries[0].contentRect.width;
					if (width === containerWidth) return;
					$$invalidate(4, getComputedCols = getColumn(width, cols));
					$$invalidate(6, xPerPx = width / getComputedCols);

					if (!containerWidth) {
						$$invalidate(0, items = specifyUndefinedColumns(items, getComputedCols, cols));
						dispatch("mount", { cols: getComputedCols, xPerPx, yPerPx });
					} else {
						onResize();
					}

					containerWidth = width;
				});
			});

		sizeObserver.observe(container);
		return () => sizeObserver.disconnect();
	});

	const updateMatrix = ({ detail }) => {
		let activeItem = getItemById(detail.id, items);

		if (activeItem) {
			activeItem = {
				...activeItem,
				[getComputedCols]: {
					...activeItem[getComputedCols],
					...detail.shadow
				}
			};

			if (fillSpace) {
				$$invalidate(0, items = moveItemsAroundItem(activeItem, items, getComputedCols, getItemById(detail.id, items)));
			} else {
				$$invalidate(0, items = moveItem$1(activeItem, items, getComputedCols, getItemById(detail.id, items)));
			}

			if (detail.onUpdate) detail.onUpdate();

			dispatch("change", {
				unsafeItem: activeItem,
				id: activeItem.id,
				cols: getComputedCols
			});
		}
	};

	const throttleMatrix = throttle(updateMatrix, throttleResize);

	const handleRepaint = ({ detail }) => {
		if (!detail.isPointerUp) {
			throttleMatrix({ detail });
		} else {
			updateMatrix({ detail });
		}
	};

	function div_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			container = $$value;
			$$invalidate(5, container);
		});
	}

	$$self.$$set = $$props => {
		if ('fillSpace' in $$props) $$invalidate(13, fillSpace = $$props.fillSpace);
		if ('items' in $$props) $$invalidate(0, items = $$props.items);
		if ('rowHeight' in $$props) $$invalidate(14, rowHeight = $$props.rowHeight);
		if ('cols' in $$props) $$invalidate(15, cols = $$props.cols);
		if ('gap' in $$props) $$invalidate(16, gap = $$props.gap);
		if ('fastStart' in $$props) $$invalidate(1, fastStart = $$props.fastStart);
		if ('throttleUpdate' in $$props) $$invalidate(17, throttleUpdate = $$props.throttleUpdate);
		if ('throttleResize' in $$props) $$invalidate(18, throttleResize = $$props.throttleResize);
		if ('scroller' in $$props) $$invalidate(2, scroller = $$props.scroller);
		if ('sensor' in $$props) $$invalidate(3, sensor = $$props.sensor);
		if ('$$scope' in $$props) $$invalidate(21, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*gap*/ 65536) {
			$$invalidate(9, [gapX, gapY] = gap, gapX, ($$invalidate(8, gapY), $$invalidate(16, gap)));
		}

		if ($$self.$$.dirty[0] & /*items, getComputedCols*/ 17) {
			$$invalidate(7, containerHeight = getContainerHeight(items, yPerPx, getComputedCols));
		}
	};

	return [
		items,
		fastStart,
		scroller,
		sensor,
		getComputedCols,
		container,
		xPerPx,
		containerHeight,
		gapY,
		gapX,
		yPerPx,
		pointerup,
		handleRepaint,
		fillSpace,
		rowHeight,
		cols,
		gap,
		throttleUpdate,
		throttleResize,
		slots,
		div_binding,
		$$scope
	];
}

class Src extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$1,
			create_fragment$1,
			safe_not_equal,
			{
				fillSpace: 13,
				items: 0,
				rowHeight: 14,
				cols: 15,
				gap: 16,
				fastStart: 1,
				throttleUpdate: 17,
				throttleResize: 18,
				scroller: 2,
				sensor: 3
			},
			add_css,
			[-1, -1]
		);
	}
}

const makeMatrix = (rows, cols) => Array.from(Array(rows), () => new Array(cols)); // make 2d array

function makeMatrixFromItems(items, _row, _col) {
  let matrix = makeMatrix(_row, _col);

  for (var i = 0; i < items.length; i++) {
    const value = items[i][_col];
    if (value) {
      const { x, y, h } = value;
      const id = items[i].id;
      const w = Math.min(_col, value.w);

      for (var j = y; j < y + h; j++) {
        const row = matrix[j];
        for (var k = x; k < x + w; k++) {
          row[k] = { ...value, id };
        }
      }
    }
  }
  return matrix;
}

function findCloseBlocks(items, matrix, curObject) {
  const { h, x, y } = curObject;

  const w = Math.min(matrix[0].length, curObject.w);
  const tempR = matrix.slice(y, y + h);

  let result = [];
  for (var i = 0; i < tempR.length; i++) {
    let tempA = tempR[i].slice(x, x + w);
    result = [...result, ...tempA.map((val) => val.id && val.id !== curObject.id && val.id).filter(Boolean)];
  }

  return [...new Set(result)];
}

function makeMatrixFromItemsIgnore(items, ignoreList, _row, _col) {
  let matrix = makeMatrix(_row, _col);
  for (var i = 0; i < items.length; i++) {
    const value = items[i][_col];
    const id = items[i].id;
    const { x, y, h } = value;
    const w = Math.min(_col, value.w);

    if (ignoreList.indexOf(id) === -1) {
      for (var j = y; j < y + h; j++) {
        const row = matrix[j];
        if (row) {
          for (var k = x; k < x + w; k++) {
            row[k] = { ...value, id };
          }
        }
      }
    }
  }
  return matrix;
}

function findItemsById(closeBlocks, items) {
  return items.filter((value) => closeBlocks.indexOf(value.id) !== -1);
}

function getRowsCount(items, cols) {
  const getItemsMaxHeight = items.map((val) => {
    const item = val[cols];

    return (item && item.y) + (item && item.h) || 0;
  });

  return Math.max(...getItemsMaxHeight, 1);
}

function findFreeSpaceForItem(matrix, item) {
  const cols = matrix[0].length;
  const w = Math.min(cols, item.w);
  let xNtime = cols - w;
  let getMatrixRows = matrix.length;

  for (var i = 0; i < getMatrixRows; i++) {
    const row = matrix[i];
    for (var j = 0; j < xNtime + 1; j++) {
      const sliceA = row.slice(j, j + w);
      const empty = sliceA.every((val) => val === undefined);
      if (empty) {
        const isEmpty = matrix.slice(i, i + item.h).every((a) => a.slice(j, j + w).every((n) => n === undefined));

        if (isEmpty) {
          return { y: i, x: j };
        }
      }
    }
  }

  return {
    y: getMatrixRows,
    x: 0,
  };
}

const getItem = (item, col) => {
  return { ...item[col], id: item.id };
};

const updateItem = (elements, active, position, col) => {
  return elements.map((value) => {
    if (value.id === active.id) {
      return { ...value, [col]: { ...value[col], ...position } };
    }
    return value;
  });
};

function moveItem(active, items, cols, original) {
  // Get current item from the breakpoint
  const item = getItem(active, cols);

  // Create matrix from the items expect the active
  let matrix = makeMatrixFromItemsIgnore(items, [item.id], getRowsCount(items, cols), cols);
  // Getting the ids of items under active Array<String>
  const closeBlocks = findCloseBlocks(items, matrix, item);
  // Getting the objects of items under active Array<Object>
  let closeObj = findItemsById(closeBlocks, items);
  // Getting whenever of these items is fixed
  const fixed = closeObj.find((value) => value[cols].fixed);

  // If found fixed, reset the active to its original position
  if (fixed) return items;

  // Update items
  items = updateItem(items, active, item, cols);

  // Create matrix of items expect close elements
  matrix = makeMatrixFromItemsIgnore(items, closeBlocks, getRowsCount(items, cols), cols);

  // Create temp vars
  let tempItems = items;
  let tempCloseBlocks = closeBlocks;

  // Exclude resolved elements ids in array
  let exclude = [];

  // Iterate over close elements under active item
  closeObj.forEach((item) => {
    // Find position for element
    let position = findFreeSpaceForItem(matrix, item[cols]);
    // Exclude item
    exclude.push(item.id);

    // Assign the position to the element in the column
    tempItems = updateItem(tempItems, item, position, cols);

    // Recreate ids of elements
    let getIgnoreItems = tempCloseBlocks.filter((value) => exclude.indexOf(value) === -1);

    // Update matrix for next iteration
    matrix = makeMatrixFromItemsIgnore(tempItems, getIgnoreItems, getRowsCount(tempItems, cols), cols);
  });

  // Return result
  return tempItems;
}

// Helper function
function normalize(items, col) {
  let result = items.slice();

  result.forEach((value) => {
    const getItem = value[col];
    if (!getItem.static) {
      result = moveItem(getItem, result, col);
    }
  });

  return result;
}

// Helper function
function adjust(items, col) {
  let matrix = makeMatrix(getRowsCount(items, col), col);

  const order = items.toSorted((a, b) => {
    const aItem = a[col];
    const bItem = b[col];

    return aItem.x - bItem.x || aItem.y - bItem.y;
  });

  return order.reduce((acc, item) => {
    let position = findFreeSpaceForItem(matrix, item[col]);

    acc.push({
      ...item,
      [col]: {
        ...item[col],
        ...position,
      },
    });

    matrix = makeMatrixFromItems(acc, getRowsCount(acc, col), col);

    return acc;
  }, []);
}

function makeItem(item) {
  const { min = { w: 1, h: 1 }, max } = item;
  return {
    fixed: false,
    resizable: !item.fixed,
    draggable: !item.fixed,
    customDragger: false,
    customResizer: false,
    min: {
      w: Math.max(1, min.w),
      h: Math.max(1, min.h),
    },
    max: { ...max },
    ...item,
  };
}

const gridHelp = {
  normalize(items, col) {
    getRowsCount(items, col);
    return normalize(items, col);
  },

  adjust(items, col) {
    return adjust(items, col);
  },

  item(obj) {
    return makeItem(obj);
  },

  findSpace(item, items, cols) {
    let matrix = makeMatrixFromItems(items, getRowsCount(items, cols), cols);

    let position = findFreeSpaceForItem(matrix, item[cols]);
    return position;
  },
};

/* src/svelte/Gallery.svelte generated by Svelte v4.2.19 */

function create_default_slot(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			attr(div, "class", "gallery-widget internal-link");
			set_style(div, "background-image", "url(" + /*dataItem*/ ctx[8].id + ")");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*dataItem*/ 256) {
				set_style(div, "background-image", "url(" + /*dataItem*/ ctx[8].id + ")");
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function create_fragment(ctx) {
	let div;
	let grid;
	let updating_items;
	let current;

	function grid_items_binding(value) {
		/*grid_items_binding*/ ctx[5](value);
	}

	let grid_props = {
		rowHeight: 100,
		cols: /*cols*/ ctx[2],
		fillSpace: /*fillFree*/ ctx[0],
		$$slots: {
			default: [
				create_default_slot,
				({ item, dataItem }) => ({ 7: item, 8: dataItem }),
				({ item, dataItem }) => (item ? 128 : 0) | (dataItem ? 256 : 0)
			]
		},
		$$scope: { ctx }
	};

	if (/*items*/ ctx[1] !== void 0) {
		grid_props.items = /*items*/ ctx[1];
	}

	grid = new Src({ props: grid_props });
	binding_callbacks.push(() => bind(grid, 'items', grid_items_binding));

	return {
		c() {
			div = element("div");
			create_component(grid.$$.fragment);
			attr(div, "class", "gallery-container");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(grid, div, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const grid_changes = {};
			if (dirty & /*fillFree*/ 1) grid_changes.fillSpace = /*fillFree*/ ctx[0];

			if (dirty & /*$$scope, dataItem*/ 768) {
				grid_changes.$$scope = { dirty, ctx };
			}

			if (!updating_items && dirty & /*items*/ 2) {
				updating_items = true;
				grid_changes.items = /*items*/ ctx[1];
				add_flush_callback(() => updating_items = false);
			}

			grid.$set(grid_changes);
		},
		i(local) {
			if (current) return;
			transition_in(grid.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(grid.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(grid);
		}
	};
}

let columns = 25;

function instance($$self, $$props, $$invalidate) {
	let { imgList } = $$props;
	let { width = 5 } = $$props;
	let { fillFree = false } = $$props;

	function generateLayout(col) {
		return new Array(imgList.length).fill(null).map(function (item, i) {
			const y = Math.ceil(Math.random() * 4) + 1;

			return {
				[columns]: gridHelp.item({
					x: i * 2 % col,
					y: Math.floor(i / 3) * y,
					w: width,
					h: y
				}),
				id: imgList[i]
			}; //data: ,
		});
	}

	let cols = [[1687, columns]];
	let items = gridHelp.adjust(generateLayout(columns), columns);

	function grid_items_binding(value) {
		items = value;
		$$invalidate(1, items);
	}

	$$self.$$set = $$props => {
		if ('imgList' in $$props) $$invalidate(3, imgList = $$props.imgList);
		if ('width' in $$props) $$invalidate(4, width = $$props.width);
		if ('fillFree' in $$props) $$invalidate(0, fillFree = $$props.fillFree);
	};

	return [fillFree, items, cols, imgList, width, grid_items_binding];
}

class Gallery extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { imgList: 3, width: 4, fillFree: 0 });
	}
}

class GalleryBlock {
    async galleryDisplay(source, el, vault, plugin) {
        const args = {
            type: 'grid',
            filter: null,
            exclusive: null,
            matchCase: null,
            imgWidth: -1,
            imgHeight: -1,
            divWidth: 100,
            divAlign: 'left',
            divHeight: -1,
            sort: null,
            reverseOrder: null,
            customList: null,
            random: -1
        };
        let other = "";
        // TODO: handle new line in field info
        source.split('\n').map(e => {
            var _a;
            if (e) {
                const param = e.trim().split(':');
                if (args.hasOwnProperty(param[0])) {
                    args[param[0]] = (_a = param[1]) === null || _a === void 0 ? void 0 : _a.trim();
                }
                else {
                    other += e + "\n";
                }
            }
        });
        const elCanvas = el.createDiv({
            cls: 'ob-gallery-display-block',
            attr: { style: `width: ${args.divWidth}%; height: ${(args.divHeight > 10) ? args.divHeight + "px" : "auto"}; float: ${args.divAlign}` }
        });
        const mediaSearch = new MediaSearch(plugin);
        if (validString(args.filter)) {
            if (/([lL][aA][sS][tT][_ ]?[uU][sS][eE][dD])/.exec(args.filter) != null) {
                if (validString(plugin.platformSettings().lastFilter)) {
                    mediaSearch.setFilter(plugin.platformSettings().lastFilter);
                }
            }
            else {
                mediaSearch.setNamedFilter(args.filter);
            }
        }
        parseAdvanceSearch(other, mediaSearch);
        if (validString(args.sort)) {
            mediaSearch.stringToSort(args.sort);
        }
        if (validString(args.reverseOrder)) {
            mediaSearch.reverse = args.reverseOrder === 'true';
        }
        if (args.imgWidth >= 0) {
            mediaSearch.maxWidth = args.imgWidth;
        }
        if (args.imgHeight >= 0) {
            mediaSearch.maxHeight = args.imgHeight;
        }
        if (validString(args.exclusive)) {
            mediaSearch.exclusive = args.exclusive === 'true';
        }
        if (validString(args.matchCase)) {
            mediaSearch.matchCase = args.matchCase === 'true';
        }
        if (args.random >= 0) {
            mediaSearch.random = args.random;
        }
        if (validString(args.customList)) {
            mediaSearch.customList = args.customList.split(' ').map(i => parseInt(i));
        }
        await mediaSearch.updateData();
        if (args.type === 'grid') {
            const mediaGrid = new MediaGrid(elCanvas, mediaSearch, plugin);
            mediaGrid.updateDisplay();
            plugin.onResize = () => {
                mediaGrid.updateDisplay();
            };
            mediaGrid.setupClickEvents();
        }
        if (args.type === 'active-thumb') {
            new Gallery({
                props: {
                    imgList: mediaSearch.imgList,
                    width: args.imgWidth / 50,
                    fillFree: true
                },
                target: elCanvas
            });
        }
    }
}

var _GalleryInfo_instances, _GalleryInfo_updateLinks;
class GalleryInfo {
    constructor(parent, doc, plugin) {
        _GalleryInfo_instances.add(this);
        this.plugin = plugin;
        this.doc = doc;
        this.parent = parent;
    }
    updateDisplay() {
        this.parent.replaceChildren();
        const block = this.parent.createDiv({ cls: 'gallery-info-container' });
        let current;
        let currentVal;
        if (!this.infoList.contains("name") && this.imgFile) {
            current = block.createDiv({ cls: 'gallery-info-section' });
            current.createSpan({ cls: 'gallery-info-section-label' }).textContent = loc('IMAGE_INFO_FIELD_NAME');
            current.createDiv({ cls: 'gallery-info-section-value' }).textContent = this.imgFile.basename;
        }
        if (!this.infoList.contains("path")) {
            current = block.createDiv({ cls: 'gallery-info-section' });
            current.createSpan({ cls: 'gallery-info-section-label' }).textContent = loc('IMAGE_INFO_FIELD_PATH');
            const imgLink = current.createDiv({ cls: 'gallery-info-section-value' }).createEl("a", { cls: 'internal-link' });
            imgLink.dataset.href = this.imgPath;
            imgLink.textContent = this.imgPath;
        }
        if (!this.infoList.contains("extension") && this.imgFile) {
            current = block.createDiv({ cls: 'gallery-info-section' });
            current.createSpan({ cls: 'gallery-info-section-label' }).textContent = loc('IMAGE_INFO_FIELD_EXTENSION');
            current.createDiv({ cls: 'gallery-info-section-value' }).textContent = this.imgFile.extension;
        }
        if (!this.infoList.contains("size") && this.imgFile) {
            current = block.createDiv({ cls: 'gallery-info-section' });
            current.createSpan({ cls: 'gallery-info-section-label' }).textContent = loc('IMAGE_INFO_FIELD_SIZE');
            current.createDiv({ cls: 'gallery-info-section-value' }).textContent = (this.imgFile.stat.size / 1000000).toPrecision(3) + " Mb";
        }
        if (!this.infoList.contains("dimensions")) {
            current = block.createDiv({ cls: 'gallery-info-section' });
            current.createSpan({ cls: 'gallery-info-section-label' }).textContent = loc('IMAGE_INFO_FIELD_DIMENSIONS');
            const dimensionsEl = current.createDiv({ cls: 'gallery-info-section-value' });
            dimensionsEl.textContent = this.width + "x" + this.height + " px";
            if (this.dimensions) {
                this.dimensions.addEventListener("loadedmetadata", (e) => {
                    dimensionsEl.textContent = this.dimensions.videoWidth + "x" + this.dimensions.videoHeight + " px";
                });
            }
        }
        if (!this.infoList.contains("date") && this.imgFile) {
            current = block.createDiv({ cls: 'gallery-info-section' });
            current.createSpan({ cls: 'gallery-info-section-label' }).textContent = loc('IMAGE_INFO_FIELD_DATE');
            current.createDiv({ cls: 'gallery-info-section-value' }).textContent = new Date(this.imgFile.stat.ctime).toDateString();
        }
        if (!this.infoList.contains("imagetags")) {
            current = block.createDiv({ cls: 'gallery-info-section' });
            current.createSpan({ cls: 'gallery-info-section-label' }).textContent = loc('IMAGE_INFO_FIELD_IMAGE_TAGS');
            currentVal = current.createDiv({ cls: 'gallery-info-section-value' });
            if (this.tagList != null) {
                for (let i = 0; i < this.tagList.length; i++) {
                    const pill = currentVal.createDiv("gallery-info-section-pill");
                    pill.style.backgroundColor = this.plugin.accentColorDark + "44";
                    const currentTag = pill.createSpan("multi-select-pill-content");
                    currentTag.textContent = this.tagList[i];
                    currentTag.addEventListener('click', async (s) => {
                        getSearch("tag:" + this.tagList[i].replace("#", ""), this.plugin.app);
                    });
                    const removal = pill.createDiv("multi-select-pill-remove-button");
                    obsidian.setIcon(removal, 'x');
                    removal.addEventListener('click', async (s) => {
                        await removeTag(this.imgInfo, this.tagList[i], this.plugin);
                        this.tagList.remove(this.tagList[i]);
                        this.updateDisplay();
                    });
                }
            }
            const newTagEl = currentVal.createEl("input", { cls: "new-tag-input" });
            newTagEl.name = "new-tag";
            newTagEl.placeholder = loc('IMAGE_INFO_FIELD_NEW_TAG');
            const suggetions = new SuggestionDropdown(newTagEl, () => { return this.plugin.getTags(); }, async (s) => {
                const tag = s.trim();
                if (!validString(tag)) {
                    return;
                }
                await addTag(this.imgInfo, tag, this.plugin);
                this.tagList.push(tag);
                this.updateDisplay();
                document.querySelector("input[name='new-tag']").focus();
            });
            suggetions.ignoreList = this.tagList;
        }
        const propertyList = Object.keys(this.autoCompleteList);
        for (let index = 0; index < propertyList.length; index++) {
            const field = propertyList[index];
            const items = this.autoCompleteList[field];
            current = block.createDiv({ cls: 'gallery-info-section' });
            current.createSpan({ cls: 'gallery-info-section-label' }).textContent = field;
            currentVal = current.createDiv({ cls: 'gallery-info-section-value' });
            if (items != null) {
                for (let i = 0; i < items.length; i++) {
                    const pill = currentVal.createDiv("gallery-info-section-pill");
                    pill.style.backgroundColor = this.plugin.accentColorDark + "44";
                    const currentTag = pill.createSpan("multi-select-pill-content");
                    currentTag.textContent = items[i];
                    currentTag.addEventListener('click', async (s) => {
                        getSearch("[" + field + ":" + items[i].replace("#", "") + "]", this.plugin.app);
                    });
                    const removal = pill.createDiv("multi-select-pill-remove-button");
                    obsidian.setIcon(removal, 'x');
                    removal.addEventListener('click', async (s) => {
                        await removeTag(this.imgInfo, items[i], this.plugin, field);
                        items.remove(items[i]);
                        this.updateDisplay();
                    });
                }
            }
            const newTagEl = currentVal.createEl("input", { cls: "new-tag-input" });
            newTagEl.name = "new-tag";
            newTagEl.placeholder = loc('IMAGE_INFO_FIELD_NEW_TAG');
            const suggetions = new SuggestionDropdown(newTagEl, () => { return this.plugin.getFieldTags(field); }, async (s) => {
                const tag = s.trim();
                if (!validString(tag)) {
                    return;
                }
                await addTag(this.imgInfo, tag, this.plugin, field);
                items.push(tag);
                this.updateDisplay();
                document.querySelector("input[name='new-tag']").focus();
            });
            suggetions.ignoreList = items;
        }
        if (!this.infoList.contains("backlinks")) {
            current = block.createDiv({ cls: 'gallery-info-section' });
            current.createSpan({ cls: 'gallery-info-section-label' }).textContent = loc('IMAGE_INFO_FIELD_BACKLINKS');
            currentVal = current.createDiv({ cls: 'gallery-info-section-value' });
            if (this.imgLinks != null) {
                for (let i = 0; i < this.imgLinks.length; i++) {
                    const link = currentVal.createEl("li", { cls: 'img-info-link' }).createEl("a", { cls: 'internal-link' });
                    link.dataset.href = this.imgLinks[i].path;
                    link.textContent = this.imgLinks[i].name;
                }
            }
        }
        if (this.infoLinks.length > 0 && !this.infoList.contains("infolinks")) {
            current = block.createDiv({ cls: 'gallery-info-section' });
            current.createSpan({ cls: 'gallery-info-section-label' }).textContent = loc('IMAGE_INFO_FIELD_INFOLINKS');
            currentVal = current.createDiv({ cls: 'gallery-info-section-value' });
            if (this.infoLinks != null) {
                for (let i = 0; i < this.infoLinks.length; i++) {
                    const link = currentVal.createEl("li", { cls: 'img-info-link' }).createEl("a", { cls: 'internal-link' });
                    link.dataset.href = this.infoLinks[i].path;
                    link.textContent = this.infoLinks[i].name;
                }
            }
        }
        if (this.relatedFiles.length > 0 && !this.infoList.contains("relatedfiles")) {
            current = block.createDiv({ cls: 'gallery-info-section' });
            current.createSpan({ cls: 'gallery-info-section-label' }).textContent = loc('IMAGE_INFO_FIELD_RELATED');
            currentVal = current.createDiv({ cls: 'gallery-info-section-value' });
            if (this.relatedFiles != null) {
                for (let i = 0; i < this.relatedFiles.length; i++) {
                    const link = currentVal.createEl("li", { cls: 'img-info-link' }).createEl("a", { cls: 'internal-link' });
                    link.dataset.href = this.relatedFiles[i].path;
                    link.textContent = this.relatedFiles[i].name;
                }
            }
        }
        if (!this.infoList.contains("colorpalette") && this.colorList.length > 0) {
            current = block.createDiv({ cls: 'gallery-info-section' });
            current.createSpan({ cls: 'gallery-info-section-label' }).textContent = loc('IMAGE_INFO_FIELD_PALETTE');
            currentVal = current.createDiv({ cls: 'gallery-info-section-value' });
            if (this.colorList != null) {
                for (let i = 0; i < this.colorList.length; i++) {
                    const currentColor = currentVal.createDiv({ cls: 'gallery-info-color' });
                    currentColor.ariaLabel = this.colorList[i];
                    currentColor.style.backgroundColor = this.colorList[i];
                }
            }
        }
        for (const yaml in this.frontmatter) {
            if (!this.infoList.contains(yaml.toLocaleLowerCase()) && yaml != "position") {
                current = block.createDiv({ cls: 'gallery-info-section' });
                current.createSpan({ cls: 'gallery-info-section-label' }).textContent = yaml;
                current.createDiv({ cls: 'gallery-info-section-value' }).textContent = this.frontmatter[yaml];
            }
        }
        if (!this.infoList.contains("paging")
            && (validString(this.start)
                || validString(this.prev)
                || validString(this.next))) {
            current = block.createDiv({ cls: 'gallery-info-section' });
            currentVal = current.createDiv({ cls: 'gallery-info-section-value' });
            const hasExtension = new RegExp(/\.\w{2,4}/);
            if (this.prev) {
                if (!this.prev.match(hasExtension)) {
                    this.prev += ".md";
                }
                const link = currentVal.createEl("a", { cls: 'internal-link' });
                link.style.paddingLeft = "5px";
                link.style.paddingRight = "5px";
                link.dataset.href = this.prev;
                link.textContent = loc('IMAGE_INFO_PAGING_PREV');
            }
            if (this.start) {
                if (!this.start.match(hasExtension)) {
                    this.start += ".md";
                }
                const link = currentVal.createEl("a", { cls: 'internal-link' });
                link.style.paddingLeft = "5px";
                link.style.paddingRight = "5px";
                link.dataset.href = this.start;
                link.textContent = loc('IMAGE_INFO_PAGING_START');
            }
            if (this.next) {
                if (!this.next.match(hasExtension)) {
                    this.next += ".md";
                }
                const link = currentVal.createEl("a", { cls: 'internal-link' });
                link.style.paddingLeft = "5px";
                link.style.paddingRight = "5px";
                link.dataset.href = this.next;
                link.textContent = loc('IMAGE_INFO_PAGING_NEXT');
            }
        }
        __classPrivateFieldGet(this, _GalleryInfo_instances, "m", _GalleryInfo_updateLinks).call(this);
    }
}
_GalleryInfo_instances = new WeakSet(), _GalleryInfo_updateLinks = 
// Side panel links don't work normally, so this on click helps with that
async function _GalleryInfo_updateLinks() {
    var _a;
    const files = this.plugin.app.vault.getFiles();
    const docLinks = this.doc.querySelectorAll('a.internal-link');
    for (let i = 0; i < docLinks.length; i++) {
        const docLink = docLinks[i];
        const href = (_a = docLink === null || docLink === void 0 ? void 0 : docLink.dataset) === null || _a === void 0 ? void 0 : _a.href;
        if (validString(href)) {
            let file = this.plugin.app.vault.getAbstractFileByPath(href);
            if (file == null && !href.contains('/')) {
                for (let i = 0; i < files.length; i++) {
                    if (files[i].basename == href
                        || files[i].name == href) {
                        file = files[i];
                        break;
                    }
                }
            }
            if (file == null) {
                continue;
            }
            if (file instanceof obsidian.TFile) {
                docLink.addEventListener('click', async (e) => {
                    this.plugin.app.workspace.getLeaf(false).openFile(file);
                });
                docLink.addEventListener('auxclick', async (e) => {
                    this.plugin.app.workspace.getLeaf(true).openFile(file);
                });
                docLink.addEventListener('contextmenu', async (e) => {
                    this.plugin.app.workspace.getLeaf(true).openFile(file);
                });
            }
        }
    }
};

class ImageInfoBlock {
    async galleryImageInfo(source, el, sourcePath, plugin) {
        var _a, _b, _c, _d;
        const args = {
            imgPath: '',
            ignoreInfo: ''
        };
        if (!(await plugin.strapped())) {
            return;
        }
        source.split('\n').map(e => {
            var _a;
            if (e) {
                const param = e.trim().split('=');
                args[param[0]] = (_a = param[1]) === null || _a === void 0 ? void 0 : _a.trim();
            }
        });
        let infoList = args.ignoreInfo.split(';')
            .map(param => param.trim().toLowerCase())
            .filter(e => validString(e));
        if (infoList.length == 0) {
            infoList = Object.keys(plugin.settings.hiddenInfoTicker)
                .filter(e => validString(e) && plugin.settings.hiddenInfoTicker[e])
                .map(param => param.trim().toLowerCase());
        }
        const elCanvas = el.createDiv({
            cls: 'ob-gallery-info-block',
            attr: { style: 'width: 100%; height: auto; float: left' }
        });
        let imgTFile;
        let imgURL;
        if (isRemoteMedia(args.imgPath)) {
            imgURL = args.imgPath;
        }
        else {
            args.imgPath = obsidian.normalizePath(args.imgPath);
            // Handle problematic arg
            if (!args.imgPath) {
                obsidian.MarkdownRenderer.render(plugin.app, loc('GALLERY_INFO_USAGE'), elCanvas, '/', plugin);
                return;
            }
            const mightFile = plugin.app.vault.getAbstractFileByPath(args.imgPath);
            if (!(mightFile instanceof obsidian.TFile)) {
                const found = await searchForFile(args.imgPath, plugin);
                if (found.length == 0) {
                    obsidian.MarkdownRenderer.render(plugin.app, loc('GALLERY_INFO_USAGE'), elCanvas, '/', plugin);
                    return;
                }
                else {
                    // too many options, tell the user about it
                    let output = loc('IMAGE_PATH_FAILED_FIND_WARNING');
                    for (let i = 0; i < found.length; i++) {
                        output += "- imgPath=" + found[i] + "\n";
                    }
                    obsidian.MarkdownRenderer.render(plugin.app, output, elCanvas, '/', plugin);
                    return;
                }
            }
            else {
                imgTFile = mightFile;
                if (!EXTENSIONS.contains(imgTFile.extension)) {
                    // TODO: warn that we don't handle this file type
                    return;
                }
                imgURL = plugin.app.vault.getResourcePath(imgTFile);
            }
        }
        const imgName = args.imgPath.split('/').slice(-1)[0];
        let measureEl, isVideo;
        let hexList = [];
        // Get image dimensions
        if (args.imgPath.match(VIDEO_REGEX)) {
            measureEl = document.createElement('video');
            measureEl.src = imgURL;
            isVideo = true;
        }
        else {
            measureEl = new Image();
            measureEl.src = imgURL;
            if (obsidian.Platform.isDesktopApp && imgTFile) {
                let colors = await extractColors(measureEl, EXTRACT_COLORS_OPTIONS);
                for (let i = 0; i < colors.length; i++) {
                    hexList.push(colors[i].hex);
                }
            }
            isVideo = false;
        }
        // Handle disabled img info functionality or missing info block
        const imgInfo = await getImageInfo(args.imgPath, false, plugin);
        let imgTags = null;
        let imgFields = {};
        let start = null;
        let prev = null;
        let next = null;
        let imgInfoCache = null;
        if (imgInfo) {
            imgInfoCache = plugin.app.metadataCache.getFileCache(imgInfo);
        }
        if (imgInfoCache) {
            imgTags = getTags(imgInfoCache);
            const propertyList = Object.keys(plugin.settings.autoCompleteFields);
            for (let i = 0; i < propertyList.length; i++) {
                if (plugin.settings.autoCompleteFields[propertyList[i]]) {
                    imgFields[propertyList[i]] = getTags(imgInfoCache, propertyList[i]);
                }
            }
            // get paging info if there is any
            if (imgInfoCache.frontmatter) {
                if (imgInfoCache.frontmatter.start) {
                    start = imgInfoCache.frontmatter.start.trim();
                }
                if (imgInfoCache.frontmatter.prev) {
                    prev = imgInfoCache.frontmatter.prev.trim();
                }
                if (imgInfoCache.frontmatter.next) {
                    next = imgInfoCache.frontmatter.next.trim();
                }
            }
            // add colors if we got them
            if (hexList.length > 0) {
                if (!((_a = imgInfoCache.frontmatter) === null || _a === void 0 ? void 0 : _a.Palette)) {
                    await plugin.app.fileManager.processFrontMatter(imgInfo, frontmatter => {
                        if (frontmatter.Palette && frontmatter.Palette.length > 0) {
                            return;
                        }
                        frontmatter.Palette = hexList;
                    });
                }
            }
        }
        const imgLinks = [];
        const infoLinks = [];
        const mdFiles = plugin.app.vault.getMarkdownFiles();
        for (let i = 0; i < mdFiles.length; i++) {
            const mdFile = mdFiles[i];
            const cache = plugin.app.metadataCache.getFileCache(mdFiles[i]);
            if (!cache) {
                continue;
            }
            (_b = cache.links) === null || _b === void 0 ? void 0 : _b.forEach(link => {
                if (link.link === args.imgPath || link.link === imgName) {
                    imgLinks.push({ path: mdFile.path, name: mdFile.basename });
                }
                if (link.link === imgInfo.path || link.link === imgInfo.name) {
                    infoLinks.push({ path: mdFile.path, name: mdFile.basename });
                }
            });
            (_c = cache.embeds) === null || _c === void 0 ? void 0 : _c.forEach(link => {
                if (link.link === args.imgPath || link.link === imgName) {
                    imgLinks.push({ path: mdFile.path, name: mdFile.basename });
                }
                if (link.link === imgInfo.path || link.link === imgInfo.name) {
                    infoLinks.push({ path: mdFile.path, name: mdFile.basename });
                }
            });
        }
        const relatedFiles = [];
        if (imgTFile) {
            const nearFiles = imgTFile.parent.children;
            for (let i = 0; i < nearFiles.length; i++) {
                const file = nearFiles[i];
                if (file instanceof obsidian.TFile) {
                    if (file != imgTFile
                        && (file.basename.toLocaleLowerCase().contains(imgTFile.basename.toLocaleLowerCase())
                            || imgTFile.basename.toLocaleLowerCase().contains(file.basename.toLocaleLowerCase()))) {
                        relatedFiles.push({ path: file.path, name: file.name });
                    }
                }
            }
        }
        const frontmatter = (_d = imgInfoCache === null || imgInfoCache === void 0 ? void 0 : imgInfoCache.frontmatter) !== null && _d !== void 0 ? _d : [];
        if (hexList.length == 0) {
            if (frontmatter["Palette"])
                hexList = frontmatter["Palette"];
        }
        let width, height;
        let vid;
        if (measureEl instanceof HTMLImageElement) {
            width = measureEl.naturalWidth;
            height = measureEl.naturalHeight;
        }
        else {
            vid = measureEl;
        }
        {
            const info = new GalleryInfo(elCanvas, el.parentElement, plugin);
            if (imgTFile) {
                info.imgFile = imgTFile;
            }
            info.imgPath = args.imgPath;
            info.imgInfo = imgInfo;
            info.width = width;
            info.height = height;
            info.dimensions = vid;
            info.colorList = hexList;
            info.tagList = imgTags;
            info.autoCompleteList = imgFields;
            info.isVideo = isVideo;
            info.imgLinks = imgLinks;
            info.infoLinks = infoLinks;
            info.relatedFiles = relatedFiles;
            info.start = start;
            info.prev = prev;
            info.next = next;
            info.frontmatter = frontmatter;
            info.infoList = infoList;
            info.updateDisplay();
        }
    }
}

var _SortingMenu_instances, _SortingMenu_mediaSearch, _SortingMenu_mediaGrid, _SortingMenu_createItem, _SortingMenu_submit;
var SortOptions;
(function (SortOptions) {
    SortOptions[SortOptions["NAME"] = 1] = "NAME";
    SortOptions[SortOptions["PATH"] = 2] = "PATH";
    SortOptions[SortOptions["CDATE"] = 3] = "CDATE";
    SortOptions[SortOptions["MDATE"] = 4] = "MDATE";
    SortOptions[SortOptions["SIZE"] = 5] = "SIZE";
    SortOptions[SortOptions["FLIP"] = 6] = "FLIP";
})(SortOptions || (SortOptions = {}));
class SortingMenu extends MenuPopup {
    constructor(posX, posY, mediaSearch, mediaGrid) {
        super(posX, posY, (result) => { __classPrivateFieldGet(this, _SortingMenu_instances, "m", _SortingMenu_submit).call(this, result); });
        _SortingMenu_instances.add(this);
        _SortingMenu_mediaSearch.set(this, void 0);
        _SortingMenu_mediaGrid.set(this, void 0);
        __classPrivateFieldSet(this, _SortingMenu_mediaSearch, mediaSearch, "f");
        __classPrivateFieldSet(this, _SortingMenu_mediaGrid, mediaGrid, "f");
        this.AddLabel(loc('SORT_HEADER'));
        this.addSeparator();
        __classPrivateFieldGet(this, _SortingMenu_instances, "m", _SortingMenu_createItem).call(this, SortOptions.NAME);
        __classPrivateFieldGet(this, _SortingMenu_instances, "m", _SortingMenu_createItem).call(this, SortOptions.PATH);
        __classPrivateFieldGet(this, _SortingMenu_instances, "m", _SortingMenu_createItem).call(this, SortOptions.CDATE);
        __classPrivateFieldGet(this, _SortingMenu_instances, "m", _SortingMenu_createItem).call(this, SortOptions.MDATE);
        __classPrivateFieldGet(this, _SortingMenu_instances, "m", _SortingMenu_createItem).call(this, SortOptions.SIZE);
        this.addSeparator();
        __classPrivateFieldGet(this, _SortingMenu_instances, "m", _SortingMenu_createItem).call(this, SortOptions.FLIP);
        this.show(posX, posY);
    }
}
_SortingMenu_mediaSearch = new WeakMap(), _SortingMenu_mediaGrid = new WeakMap(), _SortingMenu_instances = new WeakSet(), _SortingMenu_createItem = function _SortingMenu_createItem(option) {
    //@ts-ignore
    const label = loc("SORT_OPTION_" + option);
    let sorting;
    switch (option) {
        case SortOptions.NAME:
            sorting = Sorting.NAME;
            break;
        case SortOptions.PATH:
            sorting = Sorting.PATH;
            break;
        case SortOptions.CDATE:
            sorting = Sorting.CDATE;
            break;
        case SortOptions.MDATE:
            sorting = Sorting.MDATE;
            break;
        case SortOptions.SIZE:
            sorting = Sorting.SIZE;
            break;
        case SortOptions.FLIP:
            sorting = Sorting.UNSORTED;
            break;
    }
    let color = null;
    if (sorting == __classPrivateFieldGet(this, _SortingMenu_mediaSearch, "f").sorting) {
        color = __classPrivateFieldGet(this, _SortingMenu_mediaSearch, "f").plugin.accentColor;
    }
    if (option == SortOptions.FLIP) {
        color = __classPrivateFieldGet(this, _SortingMenu_mediaSearch, "f").reverse ? __classPrivateFieldGet(this, _SortingMenu_mediaSearch, "f").plugin.accentColor : null;
    }
    this.addItem(label, SortOptions[option], color);
}, _SortingMenu_submit = async function _SortingMenu_submit(result) {
    switch (result) {
        case SortOptions[SortOptions.NAME]:
            __classPrivateFieldGet(this, _SortingMenu_mediaSearch, "f").updateSort(Sorting.NAME, false);
            break;
        case SortOptions[SortOptions.CDATE]:
            __classPrivateFieldGet(this, _SortingMenu_mediaSearch, "f").updateSort(Sorting.CDATE, false);
            break;
        case SortOptions[SortOptions.MDATE]:
            __classPrivateFieldGet(this, _SortingMenu_mediaSearch, "f").updateSort(Sorting.MDATE, false);
            break;
        case SortOptions[SortOptions.PATH]:
            __classPrivateFieldGet(this, _SortingMenu_mediaSearch, "f").updateSort(Sorting.PATH, false);
            break;
        case SortOptions[SortOptions.SIZE]:
            __classPrivateFieldGet(this, _SortingMenu_mediaSearch, "f").updateSort(Sorting.SIZE, false);
            break;
        case SortOptions[SortOptions.FLIP]:
            __classPrivateFieldGet(this, _SortingMenu_mediaSearch, "f").updateSort(__classPrivateFieldGet(this, _SortingMenu_mediaSearch, "f").sorting, !__classPrivateFieldGet(this, _SortingMenu_mediaSearch, "f").reverse);
            break;
        default: return;
    }
    await __classPrivateFieldGet(this, _SortingMenu_mediaGrid, "f").updateDisplay();
};

var _ClassicFilter_mediaSearch, _ClassicFilter_mediaGrid, _ClassicFilter_pathFilterEl, _ClassicFilter_nameFilterEl, _ClassicFilter_tagFilterEl, _ClassicFilter_sortReverseDiv, _ClassicFilter_matchFilterDiv, _ClassicFilter_exclusiveFilterDiv, _ClassicFilter_widthScaleEl, _ClassicFilter_randomDiv, _ClassicFilter_randomEl, _ClassicFilter_countEl;
class ClassicFilter {
    constructor(containerEl, mediaGrid, mediaSearch) {
        _ClassicFilter_mediaSearch.set(this, void 0);
        _ClassicFilter_mediaGrid.set(this, void 0);
        _ClassicFilter_pathFilterEl.set(this, void 0);
        _ClassicFilter_nameFilterEl.set(this, void 0);
        _ClassicFilter_tagFilterEl.set(this, void 0);
        _ClassicFilter_sortReverseDiv.set(this, void 0);
        _ClassicFilter_matchFilterDiv.set(this, void 0);
        _ClassicFilter_exclusiveFilterDiv.set(this, void 0);
        _ClassicFilter_widthScaleEl.set(this, void 0);
        _ClassicFilter_randomDiv.set(this, void 0);
        _ClassicFilter_randomEl.set(this, void 0);
        _ClassicFilter_countEl.set(this, void 0);
        if (!containerEl) {
            return;
        }
        this.containerEl = containerEl;
        __classPrivateFieldSet(this, _ClassicFilter_mediaSearch, mediaSearch, "f");
        __classPrivateFieldSet(this, _ClassicFilter_mediaGrid, mediaGrid, "f");
        const filterTopDiv = this.containerEl.createDiv({ cls: "gallery-search-bar" });
        const filterBottomDiv = this.containerEl.createDiv({ cls: "gallery-search-bar" });
        // Filter by path
        __classPrivateFieldSet(this, _ClassicFilter_pathFilterEl, filterTopDiv.createEl('input', {
            cls: 'ob-gallery-filter-input',
            type: 'text',
            attr: { 'aria-label': loc('FILTER_PATH_TOOLTIP'), spellcheck: false, placeholder: loc('FILTER_PATH_PROMPT') }
        }), "f");
        __classPrivateFieldGet(this, _ClassicFilter_pathFilterEl, "f").addEventListener('input', async () => {
            __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").path = __classPrivateFieldGet(this, _ClassicFilter_pathFilterEl, "f").value.trim();
            await this.updateData();
            this.updateDisplay();
        });
        // Filter by Name
        __classPrivateFieldSet(this, _ClassicFilter_nameFilterEl, filterTopDiv.createEl('input', {
            cls: 'ob-gallery-filter-input',
            type: 'text',
            attr: { 'aria-label': loc('FILTER_NAME_TOOLTIP'), spellcheck: false, placeholder: loc('FILTER_NAME_PROMPT') }
        }), "f");
        __classPrivateFieldGet(this, _ClassicFilter_nameFilterEl, "f").addEventListener('input', async () => {
            __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").name = __classPrivateFieldGet(this, _ClassicFilter_nameFilterEl, "f").value.trim();
            await this.updateData();
            this.updateDisplay();
        });
        // Sort menu
        __classPrivateFieldSet(this, _ClassicFilter_sortReverseDiv, filterTopDiv.createEl('a', {
            cls: 'view-action',
            attr: { 'aria-label': loc('SORT_ORDER_TOOLTIP') }
        }), "f");
        obsidian.setIcon(__classPrivateFieldGet(this, _ClassicFilter_sortReverseDiv, "f"), "arrow-up-down");
        __classPrivateFieldGet(this, _ClassicFilter_sortReverseDiv, "f").addEventListener('click', (event) => {
            new SortingMenu(event.pageX, event.pageY, __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f"), __classPrivateFieldGet(this, _ClassicFilter_mediaGrid, "f"));
        });
        // file filter counts
        __classPrivateFieldSet(this, _ClassicFilter_countEl, filterTopDiv.createEl('label', { attr: { 'aria-label': loc('COUNT_TOOLTIP') } }), "f");
        __classPrivateFieldGet(this, _ClassicFilter_countEl, "f").setText(__classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").imgList.length + "/" + __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").totalCount);
        // Filter by Tags
        __classPrivateFieldSet(this, _ClassicFilter_tagFilterEl, filterBottomDiv.createEl('input', {
            cls: 'ob-gallery-filter-input',
            type: 'text',
            attr: { 'aria-label': loc('FILTER_TAGS_TOOLTIP'), spellcheck: false, placeholder: loc('FILTER_TAGS_PROMPT') }
        }), "f");
        __classPrivateFieldGet(this, _ClassicFilter_tagFilterEl, "f").addEventListener('input', async () => {
            __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").tag = __classPrivateFieldGet(this, _ClassicFilter_tagFilterEl, "f").value.trim();
            await this.updateData();
            this.updateDisplay();
        });
        // Filter Match Case
        __classPrivateFieldSet(this, _ClassicFilter_matchFilterDiv, filterBottomDiv.createDiv({
            cls: 'icon-toggle',
            attr: { 'aria-label': loc('FILTER_MATCH_CASE_TOOLTIP') }
        }), "f");
        obsidian.setIcon(__classPrivateFieldGet(this, _ClassicFilter_matchFilterDiv, "f"), "case-sensitive");
        __classPrivateFieldGet(this, _ClassicFilter_matchFilterDiv, "f").addEventListener('mousedown', async () => {
            __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").matchCase = !__classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").matchCase;
            if (__classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").matchCase) {
                __classPrivateFieldGet(this, _ClassicFilter_matchFilterDiv, "f").addClass("icon-checked");
            }
            else {
                __classPrivateFieldGet(this, _ClassicFilter_matchFilterDiv, "f").removeClass("icon-checked");
            }
            await this.updateData();
            this.updateDisplay();
        });
        // Filter Exclusive or inclusive
        __classPrivateFieldSet(this, _ClassicFilter_exclusiveFilterDiv, filterBottomDiv.createDiv({
            cls: 'icon-toggle',
            attr: { 'aria-label': loc('FILTER_EXCLUSIVE_TOOLTIP') }
        }), "f");
        obsidian.setIcon(__classPrivateFieldGet(this, _ClassicFilter_exclusiveFilterDiv, "f"), "check-check");
        __classPrivateFieldGet(this, _ClassicFilter_exclusiveFilterDiv, "f").addEventListener('mousedown', async () => {
            __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").exclusive = !__classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").exclusive;
            if (__classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").exclusive) {
                __classPrivateFieldGet(this, _ClassicFilter_exclusiveFilterDiv, "f").addClass("icon-checked");
            }
            else {
                __classPrivateFieldGet(this, _ClassicFilter_exclusiveFilterDiv, "f").removeClass("icon-checked");
            }
            await this.updateData();
            this.updateDisplay();
        });
        // image width scaler
        __classPrivateFieldSet(this, _ClassicFilter_widthScaleEl, filterBottomDiv.createEl("input", {
            cls: 'ob-gallery-filter-slider-input',
            type: 'range',
            attr: { 'aria-label': loc('FILTER_WIDTH_TOOLTIP') }
        }), "f");
        __classPrivateFieldGet(this, _ClassicFilter_widthScaleEl, "f").name = 'maxWidth';
        __classPrivateFieldGet(this, _ClassicFilter_widthScaleEl, "f").id = 'maxWidth';
        __classPrivateFieldGet(this, _ClassicFilter_widthScaleEl, "f").min = MIN_IMAGE_WIDTH + "";
        __classPrivateFieldGet(this, _ClassicFilter_widthScaleEl, "f").max = (__classPrivateFieldGet(this, _ClassicFilter_mediaGrid, "f").areaWidth()) + "";
        __classPrivateFieldGet(this, _ClassicFilter_widthScaleEl, "f").value = __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").maxWidth + "";
        __classPrivateFieldGet(this, _ClassicFilter_widthScaleEl, "f").addEventListener('input', async () => {
            __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").maxWidth = parseInt(__classPrivateFieldGet(this, _ClassicFilter_widthScaleEl, "f").value);
            if (__classPrivateFieldGet(this, _ClassicFilter_mediaGrid, "f").haveColumnsChanged()) {
                this.updateDisplay();
            }
        });
        // Add action button to show random options and randomize them
        __classPrivateFieldSet(this, _ClassicFilter_randomDiv, filterBottomDiv.createDiv(), "f");
        const randomButton = filterTopDiv.createEl('a', { cls: 'view-action', attr: { 'aria-label': loc('FILTER_RANDOM_TOOLTIP') } });
        obsidian.setIcon(randomButton, 'dice');
        __classPrivateFieldGet(this, _ClassicFilter_randomDiv, "f").style.display = "none";
        __classPrivateFieldGet(this, _ClassicFilter_randomDiv, "f").style.marginLeft = "auto";
        __classPrivateFieldSet(this, _ClassicFilter_randomEl, __classPrivateFieldGet(this, _ClassicFilter_randomDiv, "f").createEl('input', {
            cls: 'ob-gallery-filter-input',
            type: 'number',
            attr: { 'aria-label': loc('FILTER_RANDOM_COUNT_TOOLTIP'), min: "1", value: "10" }
        }), "f");
        __classPrivateFieldGet(this, _ClassicFilter_randomEl, "f").style.marginLeft = "auto";
        __classPrivateFieldGet(this, _ClassicFilter_randomEl, "f").addEventListener("focus", async () => {
            await this.updateData();
            this.updateDisplay();
        });
        __classPrivateFieldGet(this, _ClassicFilter_randomEl, "f").addEventListener("input", async () => {
            __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").random = parseInt(__classPrivateFieldGet(this, _ClassicFilter_randomEl, "f").value);
            await this.updateData();
            this.updateDisplay();
        });
        randomButton.onClickEvent(async () => {
            const currentMode = __classPrivateFieldGet(this, _ClassicFilter_randomDiv, "f").style.getPropertyValue('display');
            if (currentMode === 'block') {
                __classPrivateFieldGet(this, _ClassicFilter_randomDiv, "f").style.setProperty('display', 'none');
                __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").random = 0;
                __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").customList = [];
                await this.updateData();
                this.updateDisplay();
                return;
            }
            __classPrivateFieldGet(this, _ClassicFilter_randomDiv, "f").style.setProperty('display', 'block');
            __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").random = parseInt(__classPrivateFieldGet(this, _ClassicFilter_randomEl, "f").value);
            await this.updateData();
            this.updateDisplay();
        });
    }
    filterFill() {
        __classPrivateFieldGet(this, _ClassicFilter_pathFilterEl, "f").value = __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").path.trim();
        __classPrivateFieldGet(this, _ClassicFilter_nameFilterEl, "f").value = __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").name.trim();
        __classPrivateFieldGet(this, _ClassicFilter_tagFilterEl, "f").value = __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").tag.trim();
        __classPrivateFieldGet(this, _ClassicFilter_widthScaleEl, "f").value = __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").maxWidth + "px";
        if (__classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").matchCase) {
            __classPrivateFieldGet(this, _ClassicFilter_matchFilterDiv, "f").addClass("icon-checked");
        }
        else {
            __classPrivateFieldGet(this, _ClassicFilter_matchFilterDiv, "f").removeClass("icon-checked");
        }
        if (__classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").exclusive) {
            __classPrivateFieldGet(this, _ClassicFilter_exclusiveFilterDiv, "f").addClass("icon-checked");
        }
        else {
            __classPrivateFieldGet(this, _ClassicFilter_exclusiveFilterDiv, "f").removeClass("icon-checked");
        }
        if (__classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").random > 0) {
            __classPrivateFieldGet(this, _ClassicFilter_randomEl, "f").value = __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").random + "";
            __classPrivateFieldGet(this, _ClassicFilter_randomDiv, "f").style.setProperty('display', 'block');
        }
        else {
            __classPrivateFieldGet(this, _ClassicFilter_randomDiv, "f").style.setProperty('display', 'none');
        }
    }
    onResize() {
        __classPrivateFieldGet(this, _ClassicFilter_widthScaleEl, "f").max = (__classPrivateFieldGet(this, _ClassicFilter_mediaGrid, "f").areaWidth()) + "";
    }
    async updateData() {
        await __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").updateData();
        await __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").updateLastFilter();
        __classPrivateFieldGet(this, _ClassicFilter_countEl, "f").setText(__classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").imgList.length + "/" + __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").totalCount);
        __classPrivateFieldGet(this, _ClassicFilter_randomEl, "f").max = __classPrivateFieldGet(this, _ClassicFilter_mediaSearch, "f").totalCount + "";
    }
    async updateDisplay() {
        await __classPrivateFieldGet(this, _ClassicFilter_mediaGrid, "f").updateDisplay();
    }
}
_ClassicFilter_mediaSearch = new WeakMap(), _ClassicFilter_mediaGrid = new WeakMap(), _ClassicFilter_pathFilterEl = new WeakMap(), _ClassicFilter_nameFilterEl = new WeakMap(), _ClassicFilter_tagFilterEl = new WeakMap(), _ClassicFilter_sortReverseDiv = new WeakMap(), _ClassicFilter_matchFilterDiv = new WeakMap(), _ClassicFilter_exclusiveFilterDiv = new WeakMap(), _ClassicFilter_widthScaleEl = new WeakMap(), _ClassicFilter_randomDiv = new WeakMap(), _ClassicFilter_randomEl = new WeakMap(), _ClassicFilter_countEl = new WeakMap();

var _SimpleFilter_mediaSearch, _SimpleFilter_mediaGrid, _SimpleFilter_tagFilterEl, _SimpleFilter_sortReverseDiv, _SimpleFilter_exclusiveFilterDiv, _SimpleFilter_widthScaleEl;
class SimpleFilter {
    constructor(containerEl, mediaGrid, mediaSearch) {
        _SimpleFilter_mediaSearch.set(this, void 0);
        _SimpleFilter_mediaGrid.set(this, void 0);
        _SimpleFilter_tagFilterEl.set(this, void 0);
        _SimpleFilter_sortReverseDiv.set(this, void 0);
        _SimpleFilter_exclusiveFilterDiv.set(this, void 0);
        _SimpleFilter_widthScaleEl.set(this, void 0);
        if (!containerEl) {
            return;
        }
        this.containerEl = containerEl;
        __classPrivateFieldSet(this, _SimpleFilter_mediaSearch, mediaSearch, "f");
        __classPrivateFieldSet(this, _SimpleFilter_mediaGrid, mediaGrid, "f");
        const filterTopDiv = this.containerEl.createDiv({ cls: "gallery-search-bar" });
        // Filter by Tags
        __classPrivateFieldSet(this, _SimpleFilter_tagFilterEl, filterTopDiv.createEl('input', {
            cls: 'ob-gallery-filter-input',
            type: 'text',
            attr: { 'aria-label': loc('FILTER_TAGS_TOOLTIP'), spellcheck: false, placeholder: loc('FILTER_TAGS_PROMPT') }
        }), "f");
        __classPrivateFieldGet(this, _SimpleFilter_tagFilterEl, "f").addEventListener('input', async () => {
            __classPrivateFieldGet(this, _SimpleFilter_mediaSearch, "f").tag = __classPrivateFieldGet(this, _SimpleFilter_tagFilterEl, "f").value.trim();
            await this.updateData();
            this.updateDisplay();
        });
        // Filter Exclusive or inclusive
        __classPrivateFieldSet(this, _SimpleFilter_exclusiveFilterDiv, filterTopDiv.createDiv({
            cls: 'icon-toggle',
            attr: { 'aria-label': loc('FILTER_EXCLUSIVE_TOOLTIP') }
        }), "f");
        obsidian.setIcon(__classPrivateFieldGet(this, _SimpleFilter_exclusiveFilterDiv, "f"), "check-check");
        __classPrivateFieldGet(this, _SimpleFilter_exclusiveFilterDiv, "f").addEventListener('mousedown', async () => {
            __classPrivateFieldGet(this, _SimpleFilter_mediaSearch, "f").exclusive = !__classPrivateFieldGet(this, _SimpleFilter_mediaSearch, "f").exclusive;
            if (__classPrivateFieldGet(this, _SimpleFilter_mediaSearch, "f").exclusive) {
                __classPrivateFieldGet(this, _SimpleFilter_exclusiveFilterDiv, "f").addClass("icon-checked");
            }
            else {
                __classPrivateFieldGet(this, _SimpleFilter_exclusiveFilterDiv, "f").removeClass("icon-checked");
            }
            await this.updateData();
            this.updateDisplay();
        });
        // Sort menu
        __classPrivateFieldSet(this, _SimpleFilter_sortReverseDiv, filterTopDiv.createEl('a', {
            cls: 'view-action',
            attr: { 'aria-label': loc('SORT_ORDER_TOOLTIP') }
        }), "f");
        obsidian.setIcon(__classPrivateFieldGet(this, _SimpleFilter_sortReverseDiv, "f"), "arrow-up-down");
        __classPrivateFieldGet(this, _SimpleFilter_sortReverseDiv, "f").addEventListener('click', (event) => {
            new SortingMenu(event.pageX, event.pageY, __classPrivateFieldGet(this, _SimpleFilter_mediaSearch, "f"), __classPrivateFieldGet(this, _SimpleFilter_mediaGrid, "f"));
        });
        // image width scaler
        __classPrivateFieldSet(this, _SimpleFilter_widthScaleEl, filterTopDiv.createEl("input", {
            cls: 'ob-gallery-filter-slider-input',
            type: 'range',
            attr: { 'aria-label': loc('FILTER_WIDTH_TOOLTIP') }
        }), "f");
        __classPrivateFieldGet(this, _SimpleFilter_widthScaleEl, "f").name = 'maxWidth';
        __classPrivateFieldGet(this, _SimpleFilter_widthScaleEl, "f").id = 'maxWidth';
        __classPrivateFieldGet(this, _SimpleFilter_widthScaleEl, "f").min = MIN_IMAGE_WIDTH + "";
        __classPrivateFieldGet(this, _SimpleFilter_widthScaleEl, "f").max = (__classPrivateFieldGet(this, _SimpleFilter_mediaGrid, "f").areaWidth()) + "";
        __classPrivateFieldGet(this, _SimpleFilter_widthScaleEl, "f").value = __classPrivateFieldGet(this, _SimpleFilter_mediaSearch, "f").maxWidth + "";
        __classPrivateFieldGet(this, _SimpleFilter_widthScaleEl, "f").addEventListener('input', async () => {
            __classPrivateFieldGet(this, _SimpleFilter_mediaSearch, "f").maxWidth = parseInt(__classPrivateFieldGet(this, _SimpleFilter_widthScaleEl, "f").value);
            if (__classPrivateFieldGet(this, _SimpleFilter_mediaGrid, "f").haveColumnsChanged()) {
                this.updateDisplay();
            }
        });
    }
    filterFill() {
        __classPrivateFieldGet(this, _SimpleFilter_tagFilterEl, "f").value = __classPrivateFieldGet(this, _SimpleFilter_mediaSearch, "f").tag.trim();
        __classPrivateFieldGet(this, _SimpleFilter_widthScaleEl, "f").value = __classPrivateFieldGet(this, _SimpleFilter_mediaSearch, "f").maxWidth + "px";
        if (__classPrivateFieldGet(this, _SimpleFilter_mediaSearch, "f").exclusive) {
            __classPrivateFieldGet(this, _SimpleFilter_exclusiveFilterDiv, "f").addClass("icon-checked");
        }
        else {
            __classPrivateFieldGet(this, _SimpleFilter_exclusiveFilterDiv, "f").removeClass("icon-checked");
        }
    }
    onResize() {
        __classPrivateFieldGet(this, _SimpleFilter_widthScaleEl, "f").max = (__classPrivateFieldGet(this, _SimpleFilter_mediaGrid, "f").areaWidth()) + "";
    }
    async updateData() {
        await __classPrivateFieldGet(this, _SimpleFilter_mediaSearch, "f").updateData();
        await __classPrivateFieldGet(this, _SimpleFilter_mediaSearch, "f").updateLastFilter();
    }
    async updateDisplay() {
        await __classPrivateFieldGet(this, _SimpleFilter_mediaGrid, "f").updateDisplay();
    }
}
_SimpleFilter_mediaSearch = new WeakMap(), _SimpleFilter_mediaGrid = new WeakMap(), _SimpleFilter_tagFilterEl = new WeakMap(), _SimpleFilter_sortReverseDiv = new WeakMap(), _SimpleFilter_exclusiveFilterDiv = new WeakMap(), _SimpleFilter_widthScaleEl = new WeakMap();

var _FilterTypeMenu_instances, _FilterTypeMenu_current, _FilterTypeMenu_accentColor, _FilterTypeMenu_onResult, _FilterTypeMenu_createItem, _FilterTypeMenu_submit;
class FilterTypeMenu extends MenuPopup {
    constructor(posX, posY, current, accentColor, onResult) {
        super(posX, posY, (result) => { __classPrivateFieldGet(this, _FilterTypeMenu_instances, "m", _FilterTypeMenu_submit).call(this, result); });
        _FilterTypeMenu_instances.add(this);
        _FilterTypeMenu_current.set(this, void 0);
        _FilterTypeMenu_accentColor.set(this, void 0);
        _FilterTypeMenu_onResult.set(this, void 0);
        __classPrivateFieldSet(this, _FilterTypeMenu_current, current, "f");
        __classPrivateFieldSet(this, _FilterTypeMenu_accentColor, accentColor, "f");
        __classPrivateFieldSet(this, _FilterTypeMenu_onResult, onResult, "f");
        this.AddLabel(loc('FILTER_TYPE_HEADER'));
        this.addSeparator();
        __classPrivateFieldGet(this, _FilterTypeMenu_instances, "m", _FilterTypeMenu_createItem).call(this, FilterType.NONE);
        __classPrivateFieldGet(this, _FilterTypeMenu_instances, "m", _FilterTypeMenu_createItem).call(this, FilterType.SIMPLE);
        __classPrivateFieldGet(this, _FilterTypeMenu_instances, "m", _FilterTypeMenu_createItem).call(this, FilterType.CLASSIC);
        __classPrivateFieldGet(this, _FilterTypeMenu_instances, "m", _FilterTypeMenu_createItem).call(this, FilterType.ADVANCED);
        this.show(posX, posY);
    }
}
_FilterTypeMenu_current = new WeakMap(), _FilterTypeMenu_accentColor = new WeakMap(), _FilterTypeMenu_onResult = new WeakMap(), _FilterTypeMenu_instances = new WeakSet(), _FilterTypeMenu_createItem = function _FilterTypeMenu_createItem(option) {
    //@ts-ignore
    const label = loc("FILTER_TYPE_OPTION_" + option);
    let filterType;
    let color = null;
    if (filterType == __classPrivateFieldGet(this, _FilterTypeMenu_current, "f")) {
        color = __classPrivateFieldGet(this, _FilterTypeMenu_accentColor, "f");
    }
    this.addItem(label, FilterType[option], color);
}, _FilterTypeMenu_submit = async function _FilterTypeMenu_submit(result) {
    switch (result) {
        case FilterType[FilterType.NONE]:
            __classPrivateFieldGet(this, _FilterTypeMenu_onResult, "f").call(this, FilterType.NONE);
            break;
        case FilterType[FilterType.SIMPLE]:
            __classPrivateFieldGet(this, _FilterTypeMenu_onResult, "f").call(this, FilterType.SIMPLE);
            break;
        case FilterType[FilterType.CLASSIC]:
            __classPrivateFieldGet(this, _FilterTypeMenu_onResult, "f").call(this, FilterType.CLASSIC);
            break;
        case FilterType[FilterType.ADVANCED]:
            __classPrivateFieldGet(this, _FilterTypeMenu_onResult, "f").call(this, FilterType.ADVANCED);
            break;
        default: return;
    }
};

var _FilterMenu_instances, _FilterMenu_filterView, _FilterMenu_mediaSearch, _FilterMenu_plugin, _FilterMenu_userList, _FilterMenu_createItem, _FilterMenu_submit, _FilterMenu_resultPaste, _FilterMenu_resultClear, _FilterMenu_resultUser, _FilterMenu_promptFilterName;
var FilterOptions;
(function (FilterOptions) {
    FilterOptions[FilterOptions["COPY"] = 1] = "COPY";
    FilterOptions[FilterOptions["PASTE"] = 2] = "PASTE";
    FilterOptions[FilterOptions["CLEAR"] = 3] = "CLEAR";
    FilterOptions[FilterOptions["NEWCLIP"] = 4] = "NEWCLIP";
    FilterOptions[FilterOptions["NEWCURRENT"] = 5] = "NEWCURRENT";
    FilterOptions[FilterOptions["USER"] = 10] = "USER";
})(FilterOptions || (FilterOptions = {}));
class FilterMenu extends MenuPopup {
    constructor(posX, posY, filterView, mediaSearch, plugin) {
        super(posX, posY, (result) => { __classPrivateFieldGet(this, _FilterMenu_instances, "m", _FilterMenu_submit).call(this, result); });
        _FilterMenu_instances.add(this);
        _FilterMenu_filterView.set(this, void 0);
        _FilterMenu_mediaSearch.set(this, void 0);
        _FilterMenu_plugin.set(this, void 0);
        _FilterMenu_userList.set(this, void 0);
        __classPrivateFieldSet(this, _FilterMenu_filterView, filterView, "f");
        __classPrivateFieldSet(this, _FilterMenu_mediaSearch, mediaSearch, "f");
        __classPrivateFieldSet(this, _FilterMenu_plugin, plugin, "f");
        this.AddLabel(loc('FILTER_HEADER'));
        this.addSeparator();
        __classPrivateFieldGet(this, _FilterMenu_instances, "m", _FilterMenu_createItem).call(this, FilterOptions.COPY);
        __classPrivateFieldGet(this, _FilterMenu_instances, "m", _FilterMenu_createItem).call(this, FilterOptions.PASTE);
        __classPrivateFieldGet(this, _FilterMenu_instances, "m", _FilterMenu_createItem).call(this, FilterOptions.CLEAR);
        this.addSeparator();
        __classPrivateFieldGet(this, _FilterMenu_instances, "m", _FilterMenu_createItem).call(this, FilterOptions.NEWCLIP);
        __classPrivateFieldGet(this, _FilterMenu_instances, "m", _FilterMenu_createItem).call(this, FilterOptions.NEWCURRENT);
        this.addSeparator();
        __classPrivateFieldSet(this, _FilterMenu_userList, __classPrivateFieldGet(this, _FilterMenu_plugin, "f").settings.namedFilters.map(x => { return x.name; }), "f");
        for (let i = 0; i < __classPrivateFieldGet(this, _FilterMenu_userList, "f").length; i++) {
            __classPrivateFieldGet(this, _FilterMenu_instances, "m", _FilterMenu_createItem).call(this, FilterOptions.USER + i);
        }
        this.show(posX, posY);
    }
}
_FilterMenu_filterView = new WeakMap(), _FilterMenu_mediaSearch = new WeakMap(), _FilterMenu_plugin = new WeakMap(), _FilterMenu_userList = new WeakMap(), _FilterMenu_instances = new WeakSet(), _FilterMenu_createItem = function _FilterMenu_createItem(option) {
    let label;
    if (option < FilterOptions.USER) {
        //@ts-ignore
        label = loc("FILTER_OPTION_" + option);
    }
    else {
        label = __classPrivateFieldGet(this, _FilterMenu_userList, "f")[option - FilterOptions.USER];
    }
    this.addItem(label, option.toString());
}, _FilterMenu_submit = async function _FilterMenu_submit(result) {
    const index = parseInt(result);
    switch (index) {
        case FilterOptions.COPY:
            await navigator.clipboard.writeText(__classPrivateFieldGet(this, _FilterMenu_mediaSearch, "f").getFilter());
            break;
        case FilterOptions.PASTE:
            await __classPrivateFieldGet(this, _FilterMenu_instances, "m", _FilterMenu_resultPaste).call(this);
            break;
        case FilterOptions.CLEAR:
            await __classPrivateFieldGet(this, _FilterMenu_instances, "m", _FilterMenu_resultClear).call(this);
            break;
        case FilterOptions.NEWCLIP:
            __classPrivateFieldGet(this, _FilterMenu_instances, "m", _FilterMenu_promptFilterName).call(this, await navigator.clipboard.readText());
            break;
        case FilterOptions.NEWCURRENT:
            __classPrivateFieldGet(this, _FilterMenu_instances, "m", _FilterMenu_promptFilterName).call(this, __classPrivateFieldGet(this, _FilterMenu_mediaSearch, "f").getFilter());
            break;
        default:
            {
                if (index < FilterOptions.USER) {
                    return;
                }
                await __classPrivateFieldGet(this, _FilterMenu_instances, "m", _FilterMenu_resultUser).call(this, index - FilterOptions.USER);
            }
    }
}, _FilterMenu_resultPaste = async function _FilterMenu_resultPaste() {
    const filterString = await navigator.clipboard.readText();
    __classPrivateFieldGet(this, _FilterMenu_mediaSearch, "f").setFilter(filterString);
    __classPrivateFieldGet(this, _FilterMenu_filterView, "f").filterFill();
    await __classPrivateFieldGet(this, _FilterMenu_filterView, "f").updateData();
    await __classPrivateFieldGet(this, _FilterMenu_filterView, "f").updateDisplay();
}, _FilterMenu_resultClear = async function _FilterMenu_resultClear() {
    __classPrivateFieldGet(this, _FilterMenu_mediaSearch, "f").clearFilter();
    __classPrivateFieldGet(this, _FilterMenu_filterView, "f").filterFill();
    await __classPrivateFieldGet(this, _FilterMenu_filterView, "f").updateData();
    await __classPrivateFieldGet(this, _FilterMenu_filterView, "f").updateDisplay();
}, _FilterMenu_resultUser = async function _FilterMenu_resultUser(index) {
    __classPrivateFieldGet(this, _FilterMenu_mediaSearch, "f").setIndexedFilter(index);
    __classPrivateFieldGet(this, _FilterMenu_filterView, "f").filterFill();
    await __classPrivateFieldGet(this, _FilterMenu_filterView, "f").updateData();
    await __classPrivateFieldGet(this, _FilterMenu_filterView, "f").updateDisplay();
}, _FilterMenu_promptFilterName = function _FilterMenu_promptFilterName(filter) {
    if (!validString(filter)) {
        filter = "";
    }
    new SuggestionPopup(__classPrivateFieldGet(this, _FilterMenu_plugin, "f").app, loc('FILTER_NEW_INFO'), "", () => { return __classPrivateFieldGet(this, _FilterMenu_userList, "f"); }, async (name) => {
        name = name.trim();
        if (!validString(name)) {
            return;
        }
        if (__classPrivateFieldGet(this, _FilterMenu_userList, "f").contains(name)) {
            __classPrivateFieldGet(this, _FilterMenu_plugin, "f").settings.namedFilters[__classPrivateFieldGet(this, _FilterMenu_userList, "f").indexOf(name)].filter = filter;
        }
        else {
            const newFilter = { name: name, filter: filter };
            __classPrivateFieldGet(this, _FilterMenu_plugin, "f").settings.namedFilters.push(newFilter);
        }
        await __classPrivateFieldGet(this, _FilterMenu_plugin, "f").saveSettings();
    }).open();
};

var _NullFilter_mediaSearch, _NullFilter_mediaGrid;
class NullFilter {
    constructor(containerEl, mediaGrid, mediaSearch) {
        _NullFilter_mediaSearch.set(this, void 0);
        _NullFilter_mediaGrid.set(this, void 0);
        if (!containerEl) {
            return;
        }
        this.containerEl = containerEl;
        __classPrivateFieldSet(this, _NullFilter_mediaSearch, mediaSearch, "f");
        __classPrivateFieldSet(this, _NullFilter_mediaGrid, mediaGrid, "f");
        this.containerEl.style.setProperty('display', 'none');
    }
    filterFill() {
    }
    onResize() {
    }
    async updateData() {
        await __classPrivateFieldGet(this, _NullFilter_mediaSearch, "f").updateData();
        await __classPrivateFieldGet(this, _NullFilter_mediaSearch, "f").updateLastFilter();
    }
    async updateDisplay() {
        await __classPrivateFieldGet(this, _NullFilter_mediaGrid, "f").updateDisplay();
    }
}
_NullFilter_mediaSearch = new WeakMap(), _NullFilter_mediaGrid = new WeakMap();

var _GrammarFilter_mediaSearch, _GrammarFilter_mediaGrid, _GrammarFilter_grammarFilterEl, _GrammarFilter_sortReverseDiv, _GrammarFilter_widthScaleEl, _GrammarFilter_countEl;
class GrammarFilter {
    constructor(containerEl, mediaGrid, mediaSearch) {
        _GrammarFilter_mediaSearch.set(this, void 0);
        _GrammarFilter_mediaGrid.set(this, void 0);
        _GrammarFilter_grammarFilterEl.set(this, void 0);
        _GrammarFilter_sortReverseDiv.set(this, void 0);
        _GrammarFilter_widthScaleEl.set(this, void 0);
        _GrammarFilter_countEl.set(this, void 0);
        if (!containerEl) {
            return;
        }
        this.containerEl = containerEl;
        __classPrivateFieldSet(this, _GrammarFilter_mediaSearch, mediaSearch, "f");
        __classPrivateFieldSet(this, _GrammarFilter_mediaGrid, mediaGrid, "f");
        this.containerEl.style.display = "flex";
        const filterLeftDiv = this.containerEl.createDiv({ cls: "gallery-search-bar" });
        const filterRightDiv = this.containerEl.createDiv();
        const filterTopDiv = filterRightDiv.createDiv({ cls: "gallery-search-bar" });
        const filterBottomDiv = filterRightDiv.createDiv({ cls: "gallery-search-bar" });
        // Filter
        __classPrivateFieldSet(this, _GrammarFilter_grammarFilterEl, filterLeftDiv.createEl('textarea', {
            cls: 'ob-gallery-filter-input',
            attr: { 'aria-label': loc('FILTER_ADVANCED_TOOLTIP'), spellcheck: false }
        }), "f");
        __classPrivateFieldGet(this, _GrammarFilter_grammarFilterEl, "f").addEventListener('input', async () => {
            parseAdvanceSearch(__classPrivateFieldGet(this, _GrammarFilter_grammarFilterEl, "f").value, __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f"), true);
            await this.updateData();
            await this.updateDisplay();
        });
        // Sort menu
        __classPrivateFieldSet(this, _GrammarFilter_sortReverseDiv, filterTopDiv.createEl('a', {
            cls: 'view-action',
            attr: { 'aria-label': loc('SORT_ORDER_TOOLTIP') }
        }), "f");
        obsidian.setIcon(__classPrivateFieldGet(this, _GrammarFilter_sortReverseDiv, "f"), "arrow-up-down");
        __classPrivateFieldGet(this, _GrammarFilter_sortReverseDiv, "f").addEventListener('click', (event) => {
            new SortingMenu(event.pageX, event.pageY, __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f"), __classPrivateFieldGet(this, _GrammarFilter_mediaGrid, "f"));
        });
        // file filter counts
        __classPrivateFieldSet(this, _GrammarFilter_countEl, filterTopDiv.createEl('label', { attr: { 'aria-label': loc('COUNT_TOOLTIP') } }), "f");
        __classPrivateFieldGet(this, _GrammarFilter_countEl, "f").setText(__classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").imgList.length + "/" + __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").totalCount);
        // image width scaler
        __classPrivateFieldSet(this, _GrammarFilter_widthScaleEl, filterBottomDiv.createEl("input", {
            cls: 'ob-gallery-filter-slider-input',
            type: 'range',
            attr: { 'aria-label': loc('FILTER_WIDTH_TOOLTIP') }
        }), "f");
        __classPrivateFieldGet(this, _GrammarFilter_widthScaleEl, "f").name = 'maxWidth';
        __classPrivateFieldGet(this, _GrammarFilter_widthScaleEl, "f").id = 'maxWidth';
        __classPrivateFieldGet(this, _GrammarFilter_widthScaleEl, "f").min = MIN_IMAGE_WIDTH + "";
        __classPrivateFieldGet(this, _GrammarFilter_widthScaleEl, "f").max = (__classPrivateFieldGet(this, _GrammarFilter_mediaGrid, "f").areaWidth()) + "";
        __classPrivateFieldGet(this, _GrammarFilter_widthScaleEl, "f").value = __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").maxWidth + "";
        __classPrivateFieldGet(this, _GrammarFilter_widthScaleEl, "f").addEventListener('input', async () => {
            __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").maxWidth = parseInt(__classPrivateFieldGet(this, _GrammarFilter_widthScaleEl, "f").value);
            if (__classPrivateFieldGet(this, _GrammarFilter_mediaGrid, "f").haveColumnsChanged()) {
                await this.updateDisplay();
            }
        });
    }
    filterFill() {
        let value = "";
        if (__classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").path != "") {
            value += "path:" + __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").path.trim() + " ";
        }
        if (__classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").name != "") {
            value += "name:" + __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").name.trim() + " ";
        }
        if (__classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").regex != "") {
            value += "regex:" + __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").regex.trim() + " ";
        }
        if (__classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").tag != "") {
            value += "tag:" + __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").tag.trim() + " ";
        }
        const frontList = Object.keys(__classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").front);
        if (frontList.length > 0) {
            for (let i = 0; i < frontList.length; i++) {
                value += frontList[i] + ":" + __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").front[frontList[i]];
            }
        }
        __classPrivateFieldGet(this, _GrammarFilter_grammarFilterEl, "f").value = value;
        __classPrivateFieldGet(this, _GrammarFilter_widthScaleEl, "f").value = __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").maxWidth + "px";
    }
    onResize() {
        __classPrivateFieldGet(this, _GrammarFilter_widthScaleEl, "f").max = (__classPrivateFieldGet(this, _GrammarFilter_mediaGrid, "f").areaWidth()) + "";
    }
    async updateData() {
        await __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").updateData();
        await __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").updateLastFilter();
        __classPrivateFieldGet(this, _GrammarFilter_countEl, "f").setText(__classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").imgList.length + "/" + __classPrivateFieldGet(this, _GrammarFilter_mediaSearch, "f").totalCount);
    }
    async updateDisplay() {
        await __classPrivateFieldGet(this, _GrammarFilter_mediaGrid, "f").updateDisplay();
    }
}
_GrammarFilter_mediaSearch = new WeakMap(), _GrammarFilter_mediaGrid = new WeakMap(), _GrammarFilter_grammarFilterEl = new WeakMap(), _GrammarFilter_sortReverseDiv = new WeakMap(), _GrammarFilter_widthScaleEl = new WeakMap(), _GrammarFilter_countEl = new WeakMap();

class GalleryView extends obsidian.ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        // Get View Container Element
        this.headerEl = this.containerEl.querySelector('.view-header');
        // Get View Container Element
        this.viewEl = this.containerEl.querySelector('.view-content');
        if (!this.viewEl)
            return;
        this.viewEl.style.setProperty('padding', '0px');
        this.viewEl.style.setProperty('overflow', 'hidden');
        const viewActionsEl = this.containerEl.querySelector('.view-actions');
        // Create Search Control Element
        this.filterEl = this.viewEl.createDiv({ cls: 'ob-gallery-filter', attr: { style: 'display: none;' } });
        // Add button to open the filter menu
        const filterButton = viewActionsEl === null || viewActionsEl === void 0 ? void 0 : viewActionsEl.createEl('a', { cls: 'view-action', attr: { 'aria-label': loc('FILTER_TOOLTIP') } });
        obsidian.setIcon(filterButton, 'filter');
        filterButton.addEventListener('click', (event) => {
            new FilterMenu(event.pageX, event.pageY, this.filter, this.mediaSearch, this.plugin);
        });
        // Add button to open the search bar menu
        const searchButton = viewActionsEl === null || viewActionsEl === void 0 ? void 0 : viewActionsEl.createEl('a', { cls: 'view-action', attr: { 'aria-label': loc('SEARCH_TOOLTIP') } });
        obsidian.setIcon(searchButton, 'fa-search');
        searchButton.addEventListener('click', (event) => {
            new FilterTypeMenu(event.pageX, event.pageY, this.filterType, this.plugin.accentColor, (filterType) => this.setFilter(filterType));
        });
        // Add toggle for opening the info panel
        const infoToggle = viewActionsEl === null || viewActionsEl === void 0 ? void 0 : viewActionsEl.createDiv({
            cls: 'icon-toggle',
            attr: { 'aria-label': loc('INFO_TOGGLE_TOOLTIP') }
        });
        obsidian.setIcon(infoToggle, 'contact');
        if (plugin.platformSettings().rightClickInfoGallery) {
            infoToggle.addClass("icon-checked");
        }
        infoToggle.addEventListener('click', async (event) => {
            plugin.platformSettings().rightClickInfoGallery = !plugin.platformSettings().rightClickInfoGallery;
            await this.plugin.saveSettings();
            if (plugin.platformSettings().rightClickInfoGallery) {
                infoToggle.addClass("icon-checked");
            }
            else {
                infoToggle.removeClass("icon-checked");
            }
        });
        // mover the context menu to the end of the action list
        if (viewActionsEl) {
            viewActionsEl.appendChild(viewActionsEl.children[0]);
        }
        // Create gallery display Element
        this.displayEl = this.viewEl.createDiv({ cls: 'ob-gallery-display' });
        this.mediaSearch = new MediaSearch(plugin);
        this.mediaGrid = new MediaGrid(this.displayEl, this.mediaSearch, plugin);
        this.setFilter(this.plugin.platformSettings().filterType);
    }
    getViewType() {
        return OB_GALLERY;
    }
    getDisplayText() {
        return loc('GALLERY_VIEW_TITLE');
    }
    getIcon() {
        return 'fa-Images';
    }
    getState() {
        return {
            filter: this.mediaSearch.getFilter()
        };
    }
    async setState(state, result) {
        if (state && typeof state === "object") {
            if ("filter" in state &&
                state.filter &&
                typeof state.filter === "string") {
                this.mediaSearch.setFilter(state.filter);
                this.filter.filterFill();
                await this.filter.updateData();
                await this.filter.updateDisplay();
            }
        }
        super.setState(state, result);
    }
    onResize() {
        this.filter.onResize();
        this.filter.updateDisplay();
    }
    setFilter(filter) {
        this.filterEl.empty();
        this.filterType = filter;
        this.filterEl.style.setProperty('display', 'block');
        switch (filter) {
            case FilterType.NONE:
                this.filter = new NullFilter(this.filterEl, this.mediaGrid, this.mediaSearch);
                break;
            case FilterType.SIMPLE:
                this.filter = new SimpleFilter(this.filterEl, this.mediaGrid, this.mediaSearch);
                break;
            case FilterType.CLASSIC:
                this.filter = new ClassicFilter(this.filterEl, this.mediaGrid, this.mediaSearch);
                break;
            case FilterType.ADVANCED:
                this.filter = new GrammarFilter(this.filterEl, this.mediaGrid, this.mediaSearch);
                break;
        }
        this.filter.filterFill();
    }
    async onClose() {
        // Hide focus elements
        GalleryInfoView.closeInfoLeaf(this.plugin);
        await Promise.resolve();
    }
    async onOpen() {
        this.mediaSearch.clearFilter();
        if (validString(this.plugin.platformSettings().defaultFilter)) {
            if ("LAST_USED_FILTER" == this.plugin.platformSettings().defaultFilter) {
                if (validString(this.plugin.platformSettings().lastFilter)) {
                    this.mediaSearch.setFilter(this.plugin.platformSettings().lastFilter);
                }
            }
            else {
                this.mediaSearch.setNamedFilter(this.plugin.platformSettings().defaultFilter);
            }
        }
        this.filter.filterFill();
        // Add listener to change active file
        this.mediaGrid.setupClickEvents();
        this.loadResults();
    }
    async loadResults() {
        if (!(await this.plugin.strapped())) {
            return;
        }
        await this.filter.updateData();
        await this.filter.updateDisplay();
    }
}

var _GalleryTagsPlugin_instances, _GalleryTagsPlugin_bootstrapped, _GalleryTagsPlugin_bootstrap, _GalleryTagsPlugin_registerCodeBlocks, _GalleryTagsPlugin_registerEvents, _GalleryTagsPlugin_imageRegister, _GalleryTagsPlugin_buildImageCache, _GalleryTagsPlugin_buildMetaCache, _GalleryTagsPlugin_imgSelector, _GalleryTagsPlugin_refreshColors;
class GalleryTagsPlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        _GalleryTagsPlugin_instances.add(this);
        this.embedQueue = {};
        this.finalizedQueue = {};
        this.tagCache = [];
        this.propertyCache = {};
        this.imgResources = {};
        this.metaResources = {};
        _GalleryTagsPlugin_bootstrapped.set(this, void 0);
        _GalleryTagsPlugin_imgSelector.set(this, `.workspace-leaf-content[data-type='markdown'] img,`
            + `.workspace-leaf-content[data-type='image'] img,`
            + `.community-modal-details img,`
            + `#sr-flashcard-view img,`
            + `.workspace-leaf-content[data-type='markdown'] video,`
            + `.workspace-leaf-content[data-type='video'] video,`
            + `.community-modal-details video,`
            + `.video-stream video`
            + `#sr-flashcard-view video`);
        this.clickImage = (event) => {
            const targetEl = event.target;
            if (!targetEl) {
                return;
            }
            if (targetEl.classList.contains("gallery-grid-img") || targetEl.classList.contains("gallery-grid-vid")) {
                return;
            }
            if (this.platformSettings().rightClickInfo) {
                GalleryInfoView.OpenLeaf(this, targetEl.src);
            }
            if (this.platformSettings().rightClickMenu) {
                new ImageMenu(event.pageX, event.pageY, [targetEl], null, null, this);
            }
        };
        this.auxClick = async (event) => {
            if (event.button != 1) {
                return;
            }
            const targetEl = event.target;
            if (!targetEl) {
                return;
            }
            const infoFile = await getImageInfo(targetEl.src, true, this);
            if (infoFile instanceof obsidian.TFile) {
                this.app.workspace.getLeaf(true).openFile(infoFile);
            }
        };
        this.showPanel = async function () {
            const workspace = this.app.workspace;
            workspace.getLeaf(false).setViewState({ type: OB_GALLERY });
        };
    }
    async onload() {
        __classPrivateFieldSet(this, _GalleryTagsPlugin_bootstrapped, false, "f");
        this.strapped = this.strapped.bind(this);
        // Load message
        await this.loadSettings();
        console.log(loc("LOADED_PLUGIN_MESSAGE", loc('PLUGIN_NAME')));
        __classPrivateFieldGet(this, _GalleryTagsPlugin_instances, "m", _GalleryTagsPlugin_registerCodeBlocks).call(this);
        // Add Gallery Icon
        obsidian.addIcon('fa-Images', GALLERY_ICON);
        obsidian.addIcon('fa-search', GALLERY_SEARCH_ICON);
        // Register Main Gallery View
        this.registerView(OB_GALLERY, this.galleryViewCreator.bind(this));
        this.registerView(OB_GALLERY_INFO, this.galleryInfoCreator.bind(this));
        // Add Main Gallery Ribbon
        this.addRibbonIcon('fa-Images', 'Gallery', async (e) => {
            await this.showPanel();
        });
        this.addSettingTab(new GallerySettingTab(this.app, this));
        this.saveSettings();
        this.app.workspace.onLayoutReady(__classPrivateFieldGet(this, _GalleryTagsPlugin_instances, "m", _GalleryTagsPlugin_bootstrap).bind(this));
        // might use this later for integration tasks
        // this.manifest.dir
        // this.plugins.plugins.dataview.manifest.dir
    }
    platformSettings() {
        if (this.settings.uniqueMobileSettings && !obsidian.Platform.isDesktopApp) {
            return this.settings.mobile;
        }
        return this.settings.desktop;
    }
    getTags() {
        if (this.tagCache === undefined) {
            this.bootstrapFailed('CAUSE_TAG_CACHE');
            return [];
        }
        return this.tagCache;
    }
    getFieldTags(field) {
        if (this.propertyCache === undefined) {
            this.bootstrapFailed('CAUSE_TAG_CACHE');
            return [];
        }
        return this.propertyCache[field];
    }
    getImgResources() {
        if (this.imgResources === undefined) {
            this.bootstrapFailed('CAUSE_IMAGE_RESOURCES');
            return {};
        }
        return this.imgResources;
    }
    getMetaResources() {
        if (this.metaResources === undefined) {
            this.bootstrapFailed('CAUSE_META_RESOURCES');
            return {};
        }
        return this.metaResources;
    }
    bootstrapFailed(cause) {
        ToastMessage(loc('BOOTSTRAP_FAILURE', loc(cause)), 25, () => { __classPrivateFieldGet(this, _GalleryTagsPlugin_instances, "m", _GalleryTagsPlugin_bootstrap).call(this); }, 'CONTEXT_RETRY');
    }
    async buildCaches() {
        this.buildTagCache();
        __classPrivateFieldGet(this, _GalleryTagsPlugin_instances, "m", _GalleryTagsPlugin_buildImageCache).call(this);
        await __classPrivateFieldGet(this, _GalleryTagsPlugin_instances, "m", _GalleryTagsPlugin_buildMetaCache).call(this);
    }
    // wait for thing to finish loading up
    async strapped() {
        while (__classPrivateFieldGet(this, _GalleryTagsPlugin_bootstrapped, "f") !== true) {
            await new Promise(f => setTimeout(f, 300));
        }
        return Promise.resolve(true);
    }
    buildTagCache() {
        this.tagCache = [];
        this.propertyCache = {};
        const propertyList = Object.keys(this.settings.autoCompleteFields);
        for (let m = 0; m < propertyList.length; m++) {
            this.propertyCache[propertyList[m]] = [];
        }
        const files = this.app.vault.getMarkdownFiles();
        for (let i = 0; i < files.length; i++) {
            const cache = this.app.metadataCache.getFileCache(files[i]);
            const tags = getTags(cache);
            for (let k = 0; k < tags.length; k++) {
                if (!this.tagCache.contains(tags[k])) {
                    this.tagCache.push(tags[k]);
                }
            }
            for (let m = 0; m < propertyList.length; m++) {
                const field = propertyList[m];
                const newTags = getTags(cache, field);
                for (let k = 0; k < newTags.length; k++) {
                    if (!this.propertyCache[field].contains(newTags[k])) {
                        this.propertyCache[field].push(newTags[k]);
                    }
                }
            }
        }
    }
    testOption(menu, editor, info) {
        menu.addItem((item) => {
            item.setTitle("Test Option")
                //.setIcon("plus-circle")
                //.setSection("cmdr")
                .onClick(async () => {
                new obsidian.Notice("clicked option");
            });
        });
    }
    onunload() {
        console.log(loc("UNLOADING_PLUGIN_MESSAGE", loc('PLUGIN_NAME')));
        this.embedQueue = {};
        this.finalizedQueue = {};
        this.tagCache = [];
        this.imgResources = {};
        this.metaResources = {};
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        let changed = false;
        for (let i = 0; i < this.settings.namedFilters.length; i++) {
            if (this.settings.namedFilters[i].filter.contains("=")) {
                this.settings.namedFilters[i].filter = this.settings.namedFilters[i].filter.replaceAll("=", ":");
                changed = true;
            }
        }
        if (changed) {
            this.saveSettings();
        }
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
    galleryViewCreator(leaf) {
        return new GalleryView(leaf, this);
    }
    ;
    galleryInfoCreator(leaf) {
        return new GalleryInfoView(leaf, this);
    }
    ;
}
_GalleryTagsPlugin_bootstrapped = new WeakMap(), _GalleryTagsPlugin_imgSelector = new WeakMap(), _GalleryTagsPlugin_instances = new WeakSet(), _GalleryTagsPlugin_bootstrap = async function _GalleryTagsPlugin_bootstrap() {
    await this.buildCaches();
    __classPrivateFieldGet(this, _GalleryTagsPlugin_instances, "m", _GalleryTagsPlugin_refreshColors).call(this);
    __classPrivateFieldGet(this, _GalleryTagsPlugin_instances, "m", _GalleryTagsPlugin_registerEvents).call(this);
    __classPrivateFieldSet(this, _GalleryTagsPlugin_bootstrapped, true, "f");
}, _GalleryTagsPlugin_registerCodeBlocks = function _GalleryTagsPlugin_registerCodeBlocks() {
    // Register gallery display block renderer
    this.registerMarkdownCodeBlockProcessor('gallery', async (source, el, ctx) => {
        const proc = new GalleryBlock();
        await proc.galleryDisplay(source, el, this.app.vault, this);
    });
    // Register image info block
    this.registerMarkdownCodeBlockProcessor('gallery-info', async (source, el, ctx) => {
        const proc = new ImageInfoBlock();
        await proc.galleryImageInfo(source, el, ctx.sourcePath, this);
    });
}, _GalleryTagsPlugin_registerEvents = function _GalleryTagsPlugin_registerEvents() {
    // Resize event
    this.registerEvent(this.app.workspace.on("resize", () => {
        try {
            if (this.onResize) {
                this.onResize();
            }
        }
        catch (e) {
            this.onResize = null;
        }
    }));
    // Metadata changed event
    this.registerEvent(this.app.metadataCache.on("changed", async (file, data, cache) => {
        // Used for reacting to meta file creation events in real time
        if (this.embedQueue[file.path]) {
            if (isRemoteMedia(this.embedQueue[file.path])) {
                const path = this.embedQueue[file.path];
                this.finalizedQueue[file.path] = path;
                delete this.embedQueue[file.path];
                this.metaResources[path] = file.path;
                await addRemoteMeta(path, file, this);
            }
            else {
                const imgTFile = this.app.vault.getAbstractFileByPath(this.embedQueue[file.path]);
                if (imgTFile instanceof obsidian.TFile) {
                    this.finalizedQueue[file.path] = this.embedQueue[file.path];
                    delete this.embedQueue[file.path];
                    this.metaResources[imgTFile.path] = file.path;
                    await addEmbededTags(imgTFile, file, this);
                }
            }
        }
        else if (this.finalizedQueue[file.path]) {
            GalleryInfoView.OpenLeaf(this, this.finalizedQueue[file.path]);
            delete this.finalizedQueue[file.path];
        }
        // try to catch and cache any new tags
        const newTags = getTags(cache);
        for (let k = 0; k < newTags.length; k++) {
            if (!this.tagCache.contains(newTags[k])) {
                this.tagCache.push(newTags[k]);
            }
        }
        const propertyList = Object.keys(this.settings.autoCompleteFields);
        for (let i = 0; i < propertyList.length; i++) {
            const field = propertyList[i];
            if (!this.propertyCache[field]) {
                this.propertyCache[field] = [];
            }
            const newTags = getTags(cache, field);
            for (let k = 0; k < newTags.length; k++) {
                if (!this.propertyCache[field].contains(newTags[k])) {
                    this.propertyCache[field].push(newTags[k]);
                }
            }
        }
    }));
    // Image created
    this.registerEvent(this.app.vault.on("create", __classPrivateFieldGet(this, _GalleryTagsPlugin_instances, "m", _GalleryTagsPlugin_imageRegister).bind(this)));
    // Image Renamed
    this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
        __classPrivateFieldGet(this, _GalleryTagsPlugin_instances, "m", _GalleryTagsPlugin_imageRegister).call(this, file);
        // TODO: I hate every single one of these, cause it means I'm waiting on something and I don't know what
        await new Promise(f => setTimeout(f, 300));
        const infoFile = await getImageInfo(oldPath, false, this);
        this.metaResources[file.path] = infoFile.path;
        delete this.metaResources[oldPath];
        // update the links in the meta file
        if (infoFile) {
            await this.app.vault.process(infoFile, (data) => {
                data = data.replaceAll(oldPath, file.path);
                const oldUri = preprocessUri(oldPath);
                const newUri = preprocessUri(file.path);
                data = data.replaceAll(oldUri, newUri);
                return data;
            });
        }
    }));
    // this.registerEvent(
    //   this.app.workspace.on("file-menu", async (menu,editor, info) => 
    //   {
    //     new Notice("file Menu")
    //   }));
    // this.registerEvent(
    // 	this.app.workspace.on(
    // 		'editor-menu',
    // 		this.testOption
    // 	)
    // );
    const options = { capture: true };
    this.register(() => document.off('contextmenu', __classPrivateFieldGet(this, _GalleryTagsPlugin_imgSelector, "f"), this.clickImage, options));
    document.on('contextmenu', __classPrivateFieldGet(this, _GalleryTagsPlugin_imgSelector, "f"), this.clickImage, options);
    this.register(() => document.off('mousedown', __classPrivateFieldGet(this, _GalleryTagsPlugin_imgSelector, "f"), this.auxClick));
    document.on('mousedown', __classPrivateFieldGet(this, _GalleryTagsPlugin_imgSelector, "f"), this.auxClick);
}, _GalleryTagsPlugin_imageRegister = function _GalleryTagsPlugin_imageRegister(file) {
    if (!(file instanceof obsidian.TFile)) {
        return;
    }
    if (!EXTENSIONS.contains(file.extension.toLowerCase())) {
        return;
    }
    this.getImgResources()[this.app.vault.getResourcePath(file)] = file.path;
}, _GalleryTagsPlugin_buildImageCache = function _GalleryTagsPlugin_buildImageCache() {
    this.imgResources = {};
    const vaultFiles = this.app.vault.getFiles();
    for (const file of vaultFiles) {
        if (EXTENSIONS.contains(file.extension.toLowerCase())) {
            this.imgResources[this.app.vault.getResourcePath(file)] = file.path;
        }
    }
}, _GalleryTagsPlugin_buildMetaCache = async function _GalleryTagsPlugin_buildMetaCache() {
    this.metaResources = {};
    const infoFolder = this.app.vault.getAbstractFileByPath(this.settings.imgDataFolder);
    if (infoFolder instanceof obsidian.TFolder) {
        let cancel = false;
        const progress = new ProgressModal(this, infoFolder.children.length, () => { cancel = true; });
        progress.open();
        for (let i = 0; i < infoFolder.children.length; i++) {
            if (cancel) {
                new obsidian.Notice(loc('CANCEL_LOAD_NOTICE'));
                return;
            }
            progress.updateProgress(i);
            const info = infoFolder.children[i];
            if (info instanceof obsidian.TFile) {
                let imgLink = await getimageLink(info, this);
                if (info && imgLink) {
                    this.metaResources[imgLink] = info.path;
                }
            }
        }
        progress.updateProgress(infoFolder.children.length);
    }
}, _GalleryTagsPlugin_refreshColors = function _GalleryTagsPlugin_refreshColors() {
    // @ts-ignore
    this.accentColor = this.app.vault.getConfig('accentColor');
    this.accentColorDark = scaleColor(this.accentColor, 0.25);
    this.accentColorLight = scaleColor(this.accentColor, 1.5);
    let style = document.createElement('style');
    style.innerHTML = '.icon-checked { color: ' + this.accentColor + '; }';
    document.getElementsByTagName('head')[0].appendChild(style);
    style = document.createElement('style');
    style.innerHTML = '.selected-item { border: 5px solid ' + this.accentColorLight + '; }';
    document.getElementsByTagName('head')[0].appendChild(style);
};

module.exports = GalleryTagsPlugin;
