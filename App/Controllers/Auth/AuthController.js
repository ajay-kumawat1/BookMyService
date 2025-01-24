const register = async (req, res) => {
    try {
        console.log('register')
    } catch (error) {
        console.log(error)
    }
}
const login = async (req, res) => {
    try {
        console.log('login')
    } catch (error) {
        console.log(error)
    }
}

export default {
    register,
    login,
}