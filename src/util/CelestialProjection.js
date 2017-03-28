/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */

define([
        '../geom/Angle',
        '../error/ArgumentError',
        './Logger'
    ],
    function (Angle,
              ArgumentError,
              Logger) {
        'use strict';

        /**
         * Provides utilities for working with the celestial coordinate system (declination, rightAscension).
         * @exports CelestialProjection
         */
        var CelestialProjection = {

            /**
             * Computes the geographic location of the sun for a given date
             * @param {Date} date
             * @throws {ArgumentError} if the date is missing
             * @return {{latitude: Number, longitude: Number}} the geographic location
             */
            computeSunGeographicLocation: function (date) {
                if (date instanceof Date === false) {
                    throw new ArgumentError(
                        Logger.logMessage(Logger.LEVEL_SEVERE, "CelestialProjection", "computeSunGeographicLocation",
                            "missingDate"));
                }

                var julianDate = this.computeJulianDate(date);
                var celestialLocation = this.computeSunCelestialLocation(julianDate);
                return this.celestialToGeographic(celestialLocation, julianDate);
            },

            /**
             * Computes the celestial location of the sun for a given julianDate
             * @param {Number} julianDate
             * @throws {ArgumentError} if the julianDate is missing
             * @return {{declination: Number, rightAscension: Number}} the celestial location
             */
            computeSunCelestialLocation: function (julianDate) {
                if (julianDate == null) {
                    throw new ArgumentError(
                        Logger.logMessage(Logger.LEVEL_SEVERE, "CelestialProjection", "computeSunCelestialLocation",
                            "missingJulianDate"));
                }

                //number of days (positive or negative) since Greenwich noon, Terrestrial Time, on 1 January 2000 (J2000.0)
                var numDays = julianDate - 2451545;

                var meanLongitude = this.normalizeAngle(280.460 + 0.9856474 * numDays);

                var meanAnomaly = this.normalizeAngle(357.528 + 0.9856003 * numDays) * Angle.DEGREES_TO_RADIANS;

                var eclipticLongitude = meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly);
                var eclipticLongitudeRad = eclipticLongitude * Angle.DEGREES_TO_RADIANS;

                var obliquityOfTheEcliptic = (23.439 - 0.0000004 * numDays) * Angle.DEGREES_TO_RADIANS;

                var declination = Math.asin(Math.sin(obliquityOfTheEcliptic) * Math.sin(eclipticLongitudeRad)) *
                    Angle.RADIANS_TO_DEGREES;

                var rightAscension = Math.atan(Math.cos(obliquityOfTheEcliptic) * Math.tan(eclipticLongitudeRad)) *
                    Angle.RADIANS_TO_DEGREES;

                //compensate for atan result
                if (eclipticLongitude >= 90 && eclipticLongitude < 270) {
                    rightAscension += 180;
                }
                rightAscension = this.normalizeAngle(rightAscension);

                return {
                    declination: declination,
                    rightAscension: rightAscension
                };
            },

            /**
             * Converts from celestial coordinates (declination and right ascension) to geographic coordinates
             * (latitude, longitude) for a given julian date
             * @param {{declination: Number, rightAscension: Number}} celestialLocation
             * @param {Number} julianDate
             * @throws {ArgumentError} if celestialLocation or julianDate are missing
             * @return {{latitude: Number, longitude: Number}} the geographic location
             */
            celestialToGeographic: function (celestialLocation, julianDate) {
                if (!celestialLocation) {
                    throw new ArgumentError(
                        Logger.logMessage(Logger.LEVEL_SEVERE, "CelestialProjection", "celestialToGeographic",
                            "missingCelestialLocation"));
                }
                if (julianDate == null) {
                    throw new ArgumentError(
                        Logger.logMessage(Logger.LEVEL_SEVERE, "CelestialProjection", "celestialToGeographic",
                            "missingJulianDate"));
                }

                //number of days (positive or negative) since Greenwich noon, Terrestrial Time, on 1 January 2000 (J2000.0)
                var numDays = julianDate - 2451545;

                //Greenwich Mean Sidereal Time
                var GMST = this.normalizeAngle(280.46061837 + 360.98564736629 * numDays);

                //Greenwich Hour Angle
                var GHA = this.normalizeAngle(GMST - celestialLocation.rightAscension);

                var longitude = Angle.normalizedDegreesLongitude(-GHA);

                return {
                    latitude: celestialLocation.declination,
                    longitude: longitude
                };
            },

            /**
             * Computes the julian date from a javascript date object
             * @param {Date} date
             * @throws {ArgumentError} if the date is missing
             * @return {Number} the julian date
             */
            computeJulianDate: function (date) {
                if (date instanceof Date === false) {
                    throw new ArgumentError(
                        Logger.logMessage(Logger.LEVEL_SEVERE, "CelestialProjection", "computeJulianDate", "missingDate"));
                }

                var year = date.getUTCFullYear();
                var month = date.getUTCMonth() + 1;
                var day = date.getUTCDate();
                var hour = date.getUTCHours();
                var minute = date.getUTCMinutes();
                var second = date.getUTCSeconds();

                var dayFraction = (hour + minute / 60 + second / 3600) / 24;

                if (month <= 2) {
                    year -= 1;
                    month += 12;
                }

                var A = Math.floor(year / 100);
                var B = 2 - A + Math.floor(A / 4);
                var JD0h = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;

                return JD0h + dayFraction;
            },

            /**
             * Normalizes an angle between 0.0 inclusive and 360.0 exclusive
             * @param {Number} angle
             * @throws {ArgumentError} if the angle is missing
             * @return {Number} the normalised angle
             */
            normalizeAngle: function (angle) {
                if (angle == null) {
                    throw new ArgumentError(
                        Logger.logMessage(Logger.LEVEL_SEVERE, "CelestialProjection", "normalizeAngle", "missingAngle"));
                }
                return 360 * (angle / 360 - Math.floor(angle / 360));
            }

        };

        return CelestialProjection;

    });