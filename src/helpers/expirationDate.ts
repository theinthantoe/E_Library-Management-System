import moment from "moment";

export  function calculateExpirationDate(startDate : any, durationInDays : any) {
    return moment(startDate).add(durationInDays, 'days').toDate();
}

