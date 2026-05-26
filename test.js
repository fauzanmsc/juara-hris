const allUsers = [
    { name: "John", status: "Active", role: "Employee" },
    { name: "Jane", status: "Pending", role: "Admin" },
    { name: "Bob", status: "Inactive", role: "Employee" }
];

const stVal = "Active,Pending";
const roleVal = "";
const q = "";

const stArr = stVal ? stVal.split(',') : [];
const roleArr = roleVal ? roleVal.split(',') : [];

const filtered = allUsers.filter(u => {
    const matchesSearch = !q ||
        (u.name && u.name.toLowerCase().includes(q));
    const matchesStatus = stArr.length === 0 || stArr.includes(u.status);
    const matchesRole = roleArr.length === 0 || roleArr.includes(u.role);
    return matchesSearch && matchesStatus && matchesRole;
});
console.log(filtered);
