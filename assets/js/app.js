const form = document.getElementById("expenseForm")
const goal = document.getElementById("goal")
const targetAmount = document.getElementById("targetAmount")
const date = document.getElementById("date")
const saved = document.getElementById("saved")
const note = document.getElementById("note")
const addBtn = document.getElementById("addBtn")
const updateBtn = document.getElementById("updateBtn")
const spinner = document.getElementById("spinner")
const savingsContainer = document.getElementById("savingsContainer")


const baseApiUrl = `https://posts-crud-c2796-default-rtdb.firebaseio.com`;
const savingsUrl = `${baseApiUrl}/savingsApp.json`

function handleSpinner(flag) {
    if (flag) {
        spinner.classList.remove("d-none");
    } else {
        spinner.classList.add("d-none");
    }
}

function snackBar(msg, icon) {
    Swal.fire({
        text: msg,
        icon: icon,
        timer: 3000
    })
}

const localState = {
    savingArr: [],
    editId: null
}

function conNesObjToArr(obj) {
    if (!obj) {
        localState.savingArr = [];
        return
    }
    localState.savingArr = Object.entries(obj).map((ele) => ({ ...ele[1], id: ele[0] }))
}

//generic funciton 
async function fetchApi(url, method = "GET", body) {
    body = body ? JSON.stringify(body) : null
    try {
        let res = await fetch(url, {
            method: method,
            body: body,
            headers: {
                "content-Type": "Application/json"
            }
        });

        if (!res.ok) {
            throw new Error(`Error while making api call, status : ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        snackBar(err, "error")
        throw err
    }
}

//read
async function fetchSavings() {
    try {
        handleSpinner(true);
        let data = await fetchApi(savingsUrl);
        conNesObjToArr(data);
        renderSavings(localState.savingArr);

    } catch (err) {
        snackBar(err, "error");
        console.log(err);
    } finally {
        handleSpinner(false)
    }
}

function renderSavings(arr) {
    let res = "";
    arr.forEach((ele, idx) => {
        res += `
            <tr id="${ele.id}">
                    <td>${idx + 1}</td>
                    <td class="text-info h5"><b>${ele.goal}</b></td>
                    <td>&#8377; ${ele.targetAmount}</td>
                    <td>&#8377; ${ele.saved}</td>
                    <td>${ele.note}</td>
                    <td>${ele.date}</td>
                    <td class="text-center"><button onclick="onEdit(this)" class="btn btn-sm btn-outline-info">Edit</button></td>
                    <td class="text-center"><button onclick="onDelete(this)" class="btn btn-sm btn-outline-danger">Delete</button></td>
            </tr>
        `
    });

    savingsContainer.innerHTML = res;
}

fetchSavings()


//create
async function onSubmit(event) {
    event.preventDefault();
    const savingObj = {
        goal: goal.value,
        targetAmount: Number(targetAmount.value),
        date: date.value,
        saved: Number(saved.value),
        note: note.value,
        createdAt: Date.now()
    }

    try {
        handleSpinner(true)
        let res = await fetchApi(savingsUrl, "POST", savingObj)
        savingObj.id = res.name;
        localState.savingArr.push(savingObj)
        form.reset();
        let newTr = document.createElement("tr");
        newTr.id = res.name;
        newTr.innerHTML = `
                <tr id="${res.name}">
                    <td>${localState.savingArr.length + 1}</td>
                    <td class="text-info h5"><b>${savingObj.goal}</b></td>
                    <td>&#8377; ${savingObj.targetAmount}</td>
                    <td>&#8377; ${savingObj.saved}</td>
                    <td>${savingObj.note}</td>
                    <td>${savingObj.date}</td>
                    <td class="text-center"><button onclick="onEdit(this)" class="btn btn-sm btn-outline-primary">Edit</button></td>
                    <td class="text-center"><button onclick="onDelete(this)" class="btn btn-sm btn-outline-danger">Delete</button></td>
                </tr>
        `;
        savingsContainer.append(newTr);
        snackBar(`New saving with id : ${res.name} is added successfully...`, "success");

    } catch (err) {
        snackBar(err, "error")
        console.log(err);
    } finally {
        handleSpinner(false)
    }

}

//delete
async function onDelete(ele) {
    const deleteId = ele.closest("tr").id;
    try {
        let isConfirm = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        });

        if(isConfirm.isConfirmed){
            const deleteUrl = `${baseApiUrl}/savingsApp/${deleteId}.json`;
            handleSpinner(true);
            let res = await fetchApi(deleteUrl, "DELETE");
            const deleteIndex = localState.savingArr.findIndex(s => s.id === deleteId);
            localState.savingArr.splice(deleteIndex,1);
            ele.closest("tr").remove();
            snackBar(`Saving with id : ${deleteId} is delteed successfully...`, "success");
            let tds = document.querySelectorAll("tbody tr td:first-child");
            tds.forEach((sr,idx) => sr.innerText = idx + 1);
        }
    } catch (err) {
        snackBar(err, "error");
        console.log(err);
    } finally {
        handleSpinner(false)
    }
}

//edit 
function onEdit(ele){
    const editId = ele.closest("tr").id;
    localState.editId = editId;
    const editObj = localState.savingArr.find(s => s.id === editId);
    goal.value = editObj.goal;
    note.value = editObj.note;
    targetAmount.value = editObj.targetAmount;
    date.value = editObj.date;
    saved.value = editObj.saved;
    addBtn.classList.add("d-none");
    updateBtn.classList.remove("d-none");
}

//update 
async function onUpdate(){
    const updateId = localState.editId;
    const updateIndex = localState.savingArr.findIndex(s => s.id === updateId);
    const existingObj = localState.savingArr[updateIndex];
    const udpatedObj = {
        ...existingObj,
        goal: goal.value,
        targetAmount: Number(targetAmount.value),
        date: date.value,
        saved: Number(saved.value),
        note: note.value
    }
    const updateUrl = `${baseApiUrl}/savingsApp/${updateId}.json`;
    try{
        handleSpinner(true)
       let res = await fetchApi(updateUrl,"PATCH", udpatedObj);
       localState.editId = null
       localState.savingArr[updateIndex] = udpatedObj;
       let updateTr = document.getElementById(updateId);
       let tds = updateTr.getElementsByTagName("td");
       tds[1].innerText = udpatedObj.goal
       tds[2].innerText = udpatedObj.targetAmount
       tds[3].innerText = udpatedObj.saved
       tds[4].innerText = udpatedObj.note
       tds[5].innerText = udpatedObj.date
       form.reset();
       snackBar(`Saving with id ${updateId} is updated successfully...`, "success");
       addBtn.classList.remove("d-none");
       updateBtn.classList.add("d-none");

    } catch(err){
        snackBar(err, "error");
        console.log(err);
    } finally{
        handleSpinner(false);
    }
}

form.addEventListener("submit", onSubmit);
updateBtn.addEventListener("click", onUpdate)