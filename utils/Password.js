const bcrypt = require('bcrypt')

const passHash = async (bcryptPass) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(bcryptPass, salt);
        return hash
    } catch (error) {
        console.log(error);
    }
}

const passCompare = async (password, adminPassword) => {
    try {
        const compare = await bcrypt.compare(password, adminPassword);
        return compare
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    passHash,
    passCompare
}